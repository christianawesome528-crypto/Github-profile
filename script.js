const homeView = document.getElementById('home-view');
const profileView = document.getElementById('profile-view');
const notfoundView = document.getElementById('notfound-view');
const form = document.getElementById('login-form');
const input = document.getElementById('username-input');
const profileCard = document.getElementById('profile-card');
const reposGrid = document.getElementById('repos-grid');
const loader = document.getElementById('loader');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = input.value.trim();
  if (!username) return;
  navigateToUser(username);
});

function navigateToUser(username) {
  const path = `/search/${encodeURIComponent(username)}`;
  history.pushState({}, '', path);
  loadRoute();
}

async function loadRoute() {
  const match = window.location.pathname.match(/\/search\/([^\/#?]+)/);
  if (match) {
    const username = decodeURIComponent(match[1]);
    showProfile(username);
  } else if (window.location.pathname.includes('404')) {
    show404();
  } else {
    showHome();
  }
}

function showHome() {
  homeView.classList.remove('hidden');
  profileView.classList.add('hidden');
  notfoundView.classList.add('hidden');
  document.title = 'GitHub Profile Viewer';
}

function show404() {
  homeView.classList.add('hidden');
  profileView.classList.add('hidden');
  notfoundView.classList.remove('hidden');
}

async function showProfile(username) {
  homeView.classList.add('hidden');
  notfoundView.classList.add('hidden');
  profileView.classList.remove('hidden');
  profileCard.innerHTML = '';
  reposGrid.innerHTML = '';
  loader.classList.remove('hidden');

  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error('User not found');
    const user = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    const repos = reposRes.ok ? await reposRes.json() : [];

    loader.classList.add('hidden');
    document.title = `${user.name || user.login} (@${user.login})`;
    renderProfile(user, repos);
  } catch (err) {
    loader.classList.add('hidden');
    history.replaceState({}, '', '/404.html');
    show404();
  }
}

function renderProfile(user, repos) {
  profileCard.innerHTML = `
    <img src="${user.avatar_url}" alt="${user.login}" />
    <div class="profile-info">
      <h2>${user.name || user.login}</h2>
      <div class="login">@${user.login}</div>
      <div class="bio">${user.bio || ''}</div>
      <div class="stats">
        <span><strong>${user.public_repos}</strong> repos</span>
        <span><strong>${user.followers}</strong> followers</span>
        <span><strong>${user.following}</strong> following</span>
        ${user.location ? `<span>📍 ${user.location}</span>` : ''}
      </div>
    </div>
  `;

  reposGrid.innerHTML = repos.map(repo => `
    <div class="repo">
      <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
      <p>${repo.description || 'No description'}</p>
      <div class="repo-meta">
        <span>⭐ ${repo.stargazers_count}</span>
        <span>🍴 ${repo.forks_count}</span>
        <span>${repo.language || ''}</span>
      </div>
      <a class="download-btn" href="https://github.com/${user.login}/${repo.name}/archive/refs/heads/${repo.default_branch}.zip" target="_blank">Download ZIP</a>
    </div>
  `).join('');
}

window.addEventListener('popstate', loadRoute);
loadRoute();
