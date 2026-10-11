// ===================== НАСТРОЙКИ (внешний вид) =====================

const DEFAULT_SETTINGS = { fontSize: 'md', accentColor: 'blue', theme: 'light', density: 'comfortable', autoplayVideo: true, reduceMotion: false };

const ACCENT_PALETTES = {
  blue: { c1: '#0071e3', c2: '#47a3ff' },
  purple: { c1: '#5856d6', c2: '#8b89ff' },
  orange: { c1: '#ff9500', c2: '#ffb340' },
  green: { c1: '#34c759', c2: '#5ee080' },
  pink: { c1: '#ff2d55', c2: '#ff6482' },
  teal: { c1: '#30b0c7', c2: '#64d2e8' }
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('appSettings') || '{}');
    if (!saved.liquidGlassV2) {
      delete saved.theme;
      delete saved.accentColor;
      saved.liquidGlassV2 = true;
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

let appSettings = loadSettings();

function saveSettings() {
  localStorage.setItem('appSettings', JSON.stringify(appSettings));
}

function applySettings() {
  const html = document.documentElement;
  ['sm', 'md', 'lg'].forEach(s => html.classList.remove('font-' + s));
  html.classList.add('font-' + appSettings.fontSize);
  html.classList.toggle('theme-light', appSettings.theme === 'light');
  html.classList.toggle('theme-dark', appSettings.theme === 'dark');
  html.classList.toggle('density-compact', appSettings.density === 'compact');
  html.classList.toggle('reduce-motion', !!appSettings.reduceMotion);

  const p = ACCENT_PALETTES[appSettings.accentColor] || ACCENT_PALETTES.blue;
  html.style.setProperty('--accent-1', p.c1);
  html.style.setProperty('--accent-2', p.c2);
  html.style.setProperty('--accent-solid', p.c1);
  html.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${p.c1}, ${p.c2})`);
  html.style.setProperty('--accent-soft', hexToRgba(p.c1, 0.12));
  html.style.setProperty('--accent-ring', hexToRgba(p.c1, 0.4));
  html.style.setProperty('--shadow-accent', `0 8px 22px ${hexToRgba(p.c1, 0.28)}`);
}

applySettings(); // применяем сразу при загрузке скрипта — ещё до входа в систему, чтобы экран логина тоже был оформлен по вкусу

const API = '/api';
let state = {
  token: localStorage.getItem('token') || null,
  user: null,
  groups: [],
  chats: [],
  chatFilter: 'all',
  chatSearchQuery: '',
  currentChatId: null,
  chatPollTimer: null,
  unguardWindow: null,
  storyGroups: [],
  storyViewer: { groupIdx: null, storyIdx: null, timer: null }
};

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(method, url, body) {
  const res = await fetch(API + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

// ===================== AUTH SCREEN =====================

const authScreen = document.getElementById('auth-screen');
const appEl = document.getElementById('app');

document.getElementById('tab-login').onclick = () => switchAuthTab('login');
document.getElementById('tab-register').onclick = () => switchAuthTab('register');

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  if (tab === 'register') {
    // Всегда подгружаем актуальный список групп — вдруг админ только что добавил новую
    loadGroupsIntoSelect(document.getElementById('reg-group')).catch(() => {});
  }
}

async function loadGroupsIntoSelect(selectEl) {
  const { groups } = await api('GET', '/groups');
  state.groups = groups;
  const placeholder = `<option value="" disabled selected>Выберите группу</option>`;
  selectEl.innerHTML = placeholder + groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
}

loadGroupsIntoSelect(document.getElementById('reg-group')).catch(() => {});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const { token, user } = await api('POST', '/auth/login', { username, password });
    state.token = token; state.user = user;
    localStorage.setItem('token', token);
    enterApp();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('reg-fullname').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const groupId = document.getElementById('reg-group').value;
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';
  try {
    const { token, user } = await api('POST', '/auth/register', { fullName, username, password, groupId });
    state.token = token; state.user = user;
    localStorage.setItem('token', token);
    enterApp();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

function doLogout() {
  localStorage.removeItem('token');
  if (state.chatPollTimer) clearInterval(state.chatPollTimer);
  stopStoryAutoAdvance();
  state = {
    token: null, user: null, groups: [], chats: [], chatFilter: 'all', chatSearchQuery: '',
    currentChatId: null, chatPollTimer: null, unguardWindow: null, storyGroups: [],
    storyViewer: { groupIdx: null, storyIdx: null, timer: null }
  };
  appEl.classList.add('hidden');
  authScreen.classList.remove('hidden');
}
document.getElementById('logout-btn').onclick = doLogout;
document.getElementById('logout-btn-mobile').onclick = doLogout;

// ===================== APP BOOTSTRAP =====================

async function tryAutoLogin() {
  if (!state.token) return;
  try {
    const { user } = await api('GET', '/me');
    state.user = user;
    enterApp();
  } catch (e) {
    localStorage.removeItem('token');
  }
}

function enterApp() {
  authScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
  document.getElementById('me-name').textContent = `${state.user.fullName} (${roleLabel(state.user.role)})`;
  document.getElementById('nav-admin').classList.toggle('hidden', state.user.role !== 'admin');
  document.getElementById('nav-admin-mobile').classList.toggle('hidden', state.user.role !== 'admin');
  document.getElementById('nav-backups').classList.toggle('hidden', state.user.role !== 'admin');
  document.getElementById('nav-shop').classList.toggle('hidden', state.user.role !== 'student');
  document.getElementById('nav-shop-mobile').classList.toggle('hidden', state.user.role !== 'student');
  document.getElementById('profile-stat-coins-tile').classList.toggle('hidden', state.user.role !== 'student');

  document.getElementById('btn-new-assignment').classList.toggle('hidden', state.user.role === 'student');

  const canPostFeed = state.user.role === 'teacher' || state.user.role === 'admin';
  document.getElementById('feed-composer').classList.toggle('hidden', !canPostFeed);
  document.getElementById('feed-student-hint').classList.toggle('hidden', canPostFeed);
  document.getElementById('profile-feed-toggle').classList.toggle('hidden', !canPostFeed);

  setupNav();
  renderGreeting();
  renderShortcutsSkeleton();
  loadFeed();
  loadStories();
  loadChats();
  loadAssignments();
  renderProfile();
  loadOwnProfilePosts();
  loadAchievements();
  renderSettingsView();
  if (state.user.role === 'student') loadShop();
  if (state.user.role === 'admin') { loadAdminUsers(); loadAdminReports(); loadAdminProducts(); loadAdminPurchases(); loadAdminStats(); }
}

function renderGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Добрый вечер';
  if (hour < 6) greeting = 'Доброй ночи';
  else if (hour < 12) greeting = 'Доброе утро';
  else if (hour < 18) greeting = 'Добрый день';
  const firstName = (state.user.fullName || '').split(' ')[0] || state.user.fullName;
  document.getElementById('feed-greeting-text').textContent = `${greeting}, ${firstName} 👋`;
  const subtitles = {
    admin: 'Вот что происходит в колледже сегодня',
    teacher: 'Поделитесь новостью со всеми студентами',
    student: 'Вот что нового опубликовали преподаватели'
  };
  document.getElementById('feed-greeting-sub').textContent = subtitles[state.user.role] || 'Вот что нового в колледже';
  renderFeedProgress();
}

function renderFeedProgress() {
  const u = state.user;
  const xpIntoLevel = u.xp % 100;
  document.getElementById('feed-progress-xp').textContent = `${xpIntoLevel} / 100 XP`;
  document.getElementById('feed-progress-fill').style.width = xpIntoLevel + '%';
  document.getElementById('feed-progress-level').textContent = u.level;
}

const SHORTCUT_ICONS = {
  chats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>',
  feed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.4"/></svg>',
  assignments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
};

function renderShortcutsSkeleton() {
  const tiles = [
    { view: 'chats', label: 'Чаты', countId: 'shortcut-count-chats' },
    { view: 'feed', label: 'Лента', countId: 'shortcut-count-feed' },
    { view: 'assignments', label: 'Задания', countId: 'shortcut-count-assignments' },
    { view: 'profile', label: 'Профиль', countId: null }
  ];
  const el = document.getElementById('feed-shortcuts');
  el.innerHTML = tiles.map(t => `
    <div class="shortcut-tile" data-view="${t.view}">
      ${t.countId ? `<span class="count-badge hidden" id="${t.countId}"></span>` : ''}
      ${SHORTCUT_ICONS[t.view]}
      <div class="lbl">${t.label}</div>
    </div>
  `).join('');
  el.querySelectorAll('.shortcut-tile').forEach(tile => {
    tile.onclick = () => document.querySelector(`.nav-btn[data-view="${tile.dataset.view}"]`).click();
  });
}

function setShortcutCount(countId, value) {
  const el = document.getElementById(countId);
  if (!el) return;
  if (!value) {
    el.classList.add('hidden');
  } else {
    el.textContent = value;
    el.classList.remove('hidden');
  }
}

function roleLabel(r) {
  return { admin: 'Администратор', teacher: 'Преподаватель', student: 'Студент' }[r] || r;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Единая отрисовка аватара: своя фотография, если загружена, иначе буква имени на цветном фоне.
// containerClass — один из существующих классов-контейнеров (avatar, post-avatar, chat-item-avatar, story-ring-inner...)
function avatarHtml(containerClass, name, avatarUrl, avatarColor, extra = '', innerExtra = '') {
  const letter = escapeHtml(((name || '?').trim().charAt(0) || '?').toUpperCase());
  if (avatarUrl) {
    return `<div class="${containerClass} has-photo" ${extra}><img src="${avatarUrl}" alt="">${innerExtra}</div>`;
  }
  return `<div class="${containerClass} avatar-color-${avatarColor || 'orange'}" ${extra}>${letter}${innerExtra}</div>`;
}

const AVATAR_COLORS = ['orange', 'blue', 'purple', 'green', 'pink', 'teal'];
const AVATAR_COLOR_LABELS = { orange: 'Оранжевый', blue: 'Синий', purple: 'Фиолетовый', green: 'Зелёный', pink: 'Розовый', teal: 'Бирюзовый' };

// Обновляет уже существующий на странице контейнер аватара (по id), не пересоздавая его —
// нужно там, где элемент статичен в HTML (профиль, просмотрщик историй)
function setAvatarElement(el, name, avatarUrl, avatarColor) {
  if (!el) return;
  AVATAR_COLORS.forEach(c => el.classList.remove(`avatar-color-${c}`));
  el.classList.remove('has-photo');
  if (avatarUrl) {
    el.classList.add('has-photo');
    el.innerHTML = `<img src="${avatarUrl}" alt="">`;
  } else {
    el.classList.add(`avatar-color-${avatarColor || 'orange'}`);
    el.textContent = ((name || '?').trim().charAt(0) || '?').toUpperCase();
  }
}

// ===================== NAVIGATION =====================

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
      if (btn.dataset.view === 'map') loadArMap();
      if (btn.dataset.view === 'leaderboard') loadLeaderboard();
      if (btn.dataset.view === 'backups') loadBackupsView();
    };
  });
}

// ===================== КАРТА ТОЧЕК ИНТЕРЕСА (AR) =====================

document.querySelectorAll('.map-quick-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelector(`.nav-btn[data-view="${btn.dataset.view}"]`).click();
  };
});

let arViewMap = null;
let arViewMarkers = [];
let arViewUserMarker = null;

function loadArMap() {
  if (typeof ymaps === 'undefined') {
    document.getElementById('ar-map').innerHTML = `<div class="muted" style="padding:20px;">Карта не загрузилась. Проверьте API-ключ Яндекс.Карт в index.html и подключение к интернету.</div>`;
    return;
  }
  ymaps.ready(async () => {
    if (!arViewMap) {
      arViewMap = new ymaps.Map('ar-map', {
        center: [55.751244, 37.618423], zoom: 12, controls: ['zoomControl']
      });
    }
    setTimeout(() => arViewMap.container.fitToViewport(), 50);

    const { points } = await api('GET', '/ar-points');
    arViewMap.geoObjects.removeAll();
    arViewMarkers = [];

    if (!points.length) return;

    points.forEach(p => {
      const placemark = new ymaps.Placemark([p.lat, p.lng], {
        hintContent: p.label || p.title,
        balloonContent: `
          <div class="ar-popup-title">${escapeHtml(p.label || p.title)}</div>
          ${p.imageUrl ? `<img class="ar-popup-img" src="${p.imageUrl}" alt="">` : ''}
          <button class="ar-popup-btn" data-open-assignment="${p.assignmentId}">Открыть задание</button>
        `
      }, {
        preset: p.completed ? 'islands#greenDotIcon' : 'islands#orangeDotIcon'
      });
      placemark.events.add('balloonopen', () => {
        setTimeout(() => {
          const btn = document.querySelector(`[data-open-assignment="${p.assignmentId}"]`);
          if (btn) btn.onclick = () => openAssignmentDetail(p.assignmentId);
        }, 30);
      });
      arViewMap.geoObjects.add(placemark);
      arViewMarkers.push(placemark);
    });

    if (arViewMarkers.length) {
      arViewMap.setBounds(arViewMap.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 });
    }
  });
}

document.getElementById('map-locate-btn').onclick = () => {
  if (!navigator.geolocation) { alert('Геолокация не поддерживается этим браузером'); return; }
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    if (!arViewMap) return;
    if (arViewUserMarker) arViewMap.geoObjects.remove(arViewUserMarker);
    arViewUserMarker = new ymaps.Placemark([latitude, longitude], { hintContent: 'Вы здесь' }, { preset: 'islands#geolocationIcon' });
    arViewMap.geoObjects.add(arViewUserMarker);
    arViewMap.setCenter([latitude, longitude], 16);
  }, (err) => alert('Не удалось получить местоположение: ' + err.message));
};

// ===================== РЕЙТИНГ =====================

document.getElementById('leaderboard-tab-level').onclick = () => switchLeaderboardTab('level');
document.getElementById('leaderboard-tab-assignments').onclick = () => switchLeaderboardTab('assignments');

function switchLeaderboardTab(tab) {
  document.getElementById('leaderboard-tab-level').classList.toggle('active', tab === 'level');
  document.getElementById('leaderboard-tab-assignments').classList.toggle('active', tab === 'assignments');
  document.getElementById('leaderboard-level-list').classList.toggle('hidden', tab !== 'level');
  document.getElementById('leaderboard-assignments-list').classList.toggle('hidden', tab !== 'assignments');
}

function leaderboardRowHtml(entry, valueHtml, myId) {
  return `
    <div class="leaderboard-row ${entry.id === myId ? 'me' : ''}" data-user-id="${entry.id}" style="cursor:pointer;">
      <div class="leaderboard-rank">${entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</div>
      ${avatarHtml('post-avatar', entry.fullName, entry.avatarUrl, entry.avatarColor)}
      <div class="leaderboard-name">${escapeHtml(entry.fullName)}</div>
      <div class="leaderboard-value">${valueHtml}</div>
    </div>
  `;
}

async function loadLeaderboard() {
  const { byLevel, byAssignments, myId } = await api('GET', '/leaderboard');
  const levelEl = document.getElementById('leaderboard-level-list');
  const assignEl = document.getElementById('leaderboard-assignments-list');

  levelEl.innerHTML = byLevel.length
    ? byLevel.map(e => leaderboardRowHtml(e, `Ур. ${e.level} · ${e.xp} XP`, myId)).join('')
    : `<div class="muted">Пока нет данных.</div>`;

  assignEl.innerHTML = byAssignments.length
    ? byAssignments.map(e => leaderboardRowHtml(e, `${e.completedCount} вып.`, myId)).join('')
    : `<div class="muted">Пока нет данных.</div>`;

  document.querySelectorAll('#leaderboard-level-list .leaderboard-row, #leaderboard-assignments-list .leaderboard-row').forEach(row => {
    row.onclick = () => openUserProfile(Number(row.dataset.userId));
  });
}

// ===================== ЧАТЫ =====================

async function loadChats() {
  const { chats } = await api('GET', '/chats');
  state.chats = chats;
  renderChatsList();
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  setShortcutCount('shortcut-count-chats', totalUnread);
  if (chats.length && state.currentChatId === null) {
    openChat(chats[0].id);
  }
}

function renderChatsList() {
  const listEl = document.getElementById('chats-list');
  const q = state.chatSearchQuery.trim().toLowerCase();
  let filtered = state.chats;
  if (state.chatFilter === 'direct') filtered = filtered.filter(c => c.type === 'direct');
  else if (state.chatFilter === 'group') filtered = filtered.filter(c => c.type !== 'direct');
  if (q) filtered = filtered.filter(c => (c.name || '').toLowerCase().includes(q));

  if (!filtered.length) {
    listEl.innerHTML = `<div class="muted" style="padding:14px;">Ничего не найдено.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(c => {
    const isOnline = c.otherUser && c.otherUser.online;
    const onlineDot = c.type === 'direct' ? `<span class="online-dot" style="${isOnline ? '' : 'display:none;'}"></span>` : '';
    return `
    <div class="chat-item ${c.id === state.currentChatId ? 'active' : ''}" data-id="${c.id}">
      ${avatarHtml('chat-item-avatar', c.avatarLabel, c.otherUser ? c.otherUser.avatarUrl : null, c.otherUser ? c.otherUser.avatarColor : 'orange', '', onlineDot)}
      <div class="chat-item-body">
        <div class="chat-item-name">${c.pinned ? '<span class="chat-item-pin-icon">📌</span>' : ''}${escapeHtml(c.name || '—')}</div>
        <div class="chat-item-preview">${c.lastMessageText ? escapeHtml(c.lastMessageText) : 'Пока нет сообщений'}</div>
      </div>
      ${c.unreadCount ? `<div class="chat-item-unread">${c.unreadCount > 99 ? '99+' : c.unreadCount}</div>` : ''}
      <div class="chat-item-menu-wrap">
        <button class="chat-item-menu-btn" data-menu-for="${c.id}">⋮</button>
        <div class="chat-item-dropdown hidden" data-dropdown-for="${c.id}">
          <button data-pin="${c.id}">${c.pinned ? '📌 Открепить' : '📌 Закрепить'}</button>
          <button class="danger" data-hide="${c.id}">🗑 Удалить чат</button>
        </div>
      </div>
    </div>
  `;
  }).join('');

  listEl.querySelectorAll('.chat-item').forEach(item => {
    item.onclick = (e) => {
      if (e.target.closest('.chat-item-menu-wrap')) return;
      openChat(Number(item.dataset.id));
    };
  });

  listEl.querySelectorAll('.chat-item-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const dropdown = listEl.querySelector(`[data-dropdown-for="${btn.dataset.menuFor}"]`);
      const isOpen = !dropdown.classList.contains('hidden');
      listEl.querySelectorAll('.chat-item-dropdown').forEach(d => d.classList.add('hidden'));
      listEl.querySelectorAll('.chat-item-menu-btn').forEach(b => b.classList.remove('open'));
      if (!isOpen) { dropdown.classList.remove('hidden'); btn.classList.add('open'); }
    };
  });
  listEl.querySelectorAll('[data-pin]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await api('POST', `/chats/${btn.dataset.pin}/pin`);
      loadChats();
    };
  });
  listEl.querySelectorAll('[data-hide]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Удалить чат из списка? Если вам снова напишут, он появится обратно.')) return;
      await api('POST', `/chats/${btn.dataset.hide}/hide`);
      if (state.currentChatId === Number(btn.dataset.hide)) state.currentChatId = null;
      loadChats();
    };
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.chat-item-dropdown').forEach(d => d.classList.add('hidden'));
  document.querySelectorAll('.chat-item-menu-btn').forEach(b => b.classList.remove('open'));
});

document.querySelectorAll('.chat-filter-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.chat-filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.chatFilter = tab.dataset.filter;
    renderChatsList();
  };
});

document.getElementById('chats-search-input').addEventListener('input', (e) => {
  state.chatSearchQuery = e.target.value;
  renderChatsList();
});

function openChat(chatId) {
  state.currentChatId = chatId;
  renderChatsList();
  const chat = state.chats.find(c => c.id === chatId);
  document.getElementById('chat-header-title').textContent = chat ? chat.name : '';
  document.getElementById('chat-send-form').classList.remove('hidden');
  document.querySelector('.chats-layout').classList.add('chat-open'); // на мобильном экране открывает окно переписки поверх списка
  loadMessages();
  if (state.chatPollTimer) clearInterval(state.chatPollTimer);
  state.chatPollTimer = setInterval(() => { loadMessages(); loadChats(); }, 3000);
}

document.getElementById('chat-back-btn').onclick = () => {
  document.querySelector('.chats-layout').classList.remove('chat-open');
};

async function loadMessages() {
  if (!state.currentChatId) return;
  const { messages } = await api('GET', `/chats/${state.currentChatId}/messages`);
  const box = document.getElementById('chat-messages');
  const wasAtBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
  box.innerHTML = messages.map(m => {
    const own = m.userId === state.user.id;
    let mediaHtml = '';
    if (m.mediaUrl) {
      mediaHtml = m.mediaType === 'video'
        ? `<div class="msg-media"><video src="${m.mediaUrl}" controls></video></div>`
        : `<div class="msg-media"><img src="${m.mediaUrl}" alt=""></div>`;
    }
    return `
      <div class="msg ${own ? 'own' : ''}">
        <div class="msg-author">${escapeHtml(m.authorName)}${m.authorRole !== 'student' ? ' · ' + roleLabel(m.authorRole) : ''}</div>
        ${m.forwardedFrom ? `<div class="msg-forwarded">↪ Переслано от ${escapeHtml(m.forwardedFrom)}</div>` : ''}
        ${mediaHtml}
        ${m.text ? `<div class="msg-text">${escapeHtml(m.text)}</div>` : ''}
        <div class="msg-actions">
          <button class="msg-action-btn" data-forward-msg="${m.id}" title="Переслать">↪</button>
          ${own ? `<button class="msg-action-btn danger" data-delete-msg="${m.id}" title="Удалить">🗑</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  if (wasAtBottom) box.scrollTop = box.scrollHeight;

  box.querySelectorAll('[data-delete-msg]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить сообщение?')) return;
      await api('DELETE', `/messages/${btn.dataset.deleteMsg}`);
      loadMessages();
    };
  });
  box.querySelectorAll('[data-forward-msg]').forEach(btn => {
    btn.onclick = () => openForwardModal(Number(btn.dataset.forwardMsg));
  });
}

let forwardMessageId = null;

function openForwardModal(msgId) {
  forwardMessageId = msgId;
  const listEl = document.getElementById('forward-chat-list');
  if (!state.chats.length) {
    listEl.innerHTML = `<div class="muted" style="padding:8px;">Нет других чатов для пересылки</div>`;
  } else {
    listEl.innerHTML = state.chats.map(c => `
      <div class="user-result-row" data-chat-id="${c.id}">
        ${avatarHtml('post-avatar', c.avatarLabel, c.otherUser ? c.otherUser.avatarUrl : null, c.otherUser ? c.otherUser.avatarColor : 'orange')}
        <div><div class="name">${escapeHtml(c.name || '—')}</div></div>
      </div>
    `).join('');
    listEl.querySelectorAll('.user-result-row').forEach(row => {
      row.onclick = async () => {
        try {
          const targetChatId = Number(row.dataset.chatId);
          await api('POST', `/messages/${forwardMessageId}/forward`, { targetChatId });
          document.getElementById('modal-forward').classList.add('hidden');
          if (state.currentChatId === targetChatId) loadMessages();
          loadChats();
        } catch (err) {
          alert(err.message);
        }
      };
    });
  }
  document.getElementById('modal-forward').classList.remove('hidden');
}
document.getElementById('forward-close').onclick = () => document.getElementById('modal-forward').classList.add('hidden');

let pendingChatMediaDataUrl = null;

document.getElementById('chat-file-input').addEventListener('change', () => {
  const input = document.getElementById('chat-file-input');
  const file = input.files[0];
  if (!file) return;
  const MAX_CLIENT_BYTES = 15 * 1024 * 1024;
  if (file.size > MAX_CLIENT_BYTES) { alert('Файл слишком большой (максимум ~15 МБ)'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    pendingChatMediaDataUrl = reader.result;
    const previewEl = document.getElementById('chat-attach-preview');
    const mediaTag = file.type.startsWith('video')
      ? `<video src="${pendingChatMediaDataUrl}" controls></video>`
      : `<img src="${pendingChatMediaDataUrl}">`;
    previewEl.innerHTML = mediaTag + `<button type="button" class="remove-preview">✕</button>`;
    previewEl.classList.remove('hidden');
    previewEl.querySelector('.remove-preview').onclick = () => {
      pendingChatMediaDataUrl = null;
      input.value = '';
      previewEl.classList.add('hidden');
      previewEl.innerHTML = '';
    };
  };
  reader.readAsDataURL(file);
});

document.getElementById('chat-send-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if ((!text && !pendingChatMediaDataUrl) || !state.currentChatId) return;
  input.value = '';
  const mediaData = pendingChatMediaDataUrl;
  pendingChatMediaDataUrl = null;
  document.getElementById('chat-file-input').value = '';
  const previewEl = document.getElementById('chat-attach-preview');
  previewEl.classList.add('hidden');
  previewEl.innerHTML = '';
  try {
    await api('POST', `/chats/${state.currentChatId}/messages`, { text, mediaData });
  } catch (err) {
    alert(err.message);
  }
  loadMessages();
  loadChats();
});

// ===================== НОВЫЙ ЧАТ (личный / группа) =====================

let groupSelectedMembers = new Map(); // id -> publicUser

function userResultRowHtml(u) {
  return `
    <div class="user-result-row" data-id="${u.id}">
      <div class="post-avatar">${escapeHtml(u.fullName.slice(0, 1).toUpperCase())}</div>
      <div>
        <div class="name">${escapeHtml(u.fullName)}</div>
        <div class="sub">${roleLabel(u.role)} · @${escapeHtml(u.username)}</div>
      </div>
    </div>
  `;
}

function debounce(fn, delay) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

document.getElementById('btn-new-chat').onclick = () => {
  groupSelectedMembers = new Map();
  document.getElementById('newchat-search').value = '';
  document.getElementById('newchat-search-results').innerHTML = '';
  document.getElementById('newchat-group-name').value = '';
  document.getElementById('newchat-group-member-search').value = '';
  document.getElementById('newchat-group-member-results').innerHTML = '';
  document.getElementById('newchat-group-selected').innerHTML = '';
  document.getElementById('newchat-group-error').textContent = '';
  switchNewChatTab('direct');
  document.getElementById('modal-new-chat').classList.remove('hidden');
};
document.getElementById('new-chat-close').onclick = () => {
  document.getElementById('modal-new-chat').classList.add('hidden');
};

function switchNewChatTab(tab) {
  document.getElementById('newchat-tab-direct').classList.toggle('active', tab === 'direct');
  document.getElementById('newchat-tab-group').classList.toggle('active', tab === 'group');
  document.getElementById('newchat-direct-pane').classList.toggle('hidden', tab !== 'direct');
  document.getElementById('newchat-group-pane').classList.toggle('hidden', tab !== 'group');
}
document.getElementById('newchat-tab-direct').onclick = () => switchNewChatTab('direct');
document.getElementById('newchat-tab-group').onclick = () => switchNewChatTab('group');

const searchUsers = debounce(async (query, resultsEl, onPick, roleFilter) => {
  if (!query.trim()) { resultsEl.innerHTML = ''; return; }
  const roleParam = roleFilter ? `&role=${encodeURIComponent(roleFilter)}` : '';
  const { users } = await api('GET', `/users/search?q=${encodeURIComponent(query.trim())}${roleParam}`);
  resultsEl.innerHTML = users.map(userResultRowHtml).join('') || `<div class="muted" style="padding:8px;">Никого не найдено</div>`;
  resultsEl.querySelectorAll('.user-result-row').forEach(row => {
    const u = users.find(x => x.id === Number(row.dataset.id));
    row.onclick = () => onPick(u);
  });
}, 300);

document.getElementById('newchat-search').addEventListener('input', (e) => {
  searchUsers(e.target.value, document.getElementById('newchat-search-results'), async (u) => {
    try {
      const { chat } = await api('POST', '/chats/direct', { userId: u.id });
      document.getElementById('modal-new-chat').classList.add('hidden');
      await loadChats();
      openChat(chat.id);
    } catch (err) {
      alert(err.message);
    }
  });
});

function renderGroupSelectedChips() {
  const el = document.getElementById('newchat-group-selected');
  el.innerHTML = Array.from(groupSelectedMembers.values()).map(u => `
    <span class="chip" data-id="${u.id}">${escapeHtml(u.fullName)}<button type="button" data-remove="${u.id}">✕</button></span>
  `).join('');
  el.querySelectorAll('[data-remove]').forEach(btn => {
    btn.onclick = () => {
      groupSelectedMembers.delete(Number(btn.dataset.remove));
      renderGroupSelectedChips();
    };
  });
}

document.getElementById('newchat-group-member-search').addEventListener('input', (e) => {
  searchUsers(e.target.value, document.getElementById('newchat-group-member-results'), (u) => {
    groupSelectedMembers.set(u.id, u);
    renderGroupSelectedChips();
    document.getElementById('newchat-group-member-search').value = '';
    document.getElementById('newchat-group-member-results').innerHTML = '';
  });
});

document.getElementById('newchat-group-create').onclick = async () => {
  const errEl = document.getElementById('newchat-group-error');
  errEl.textContent = '';
  const name = document.getElementById('newchat-group-name').value.trim();
  if (!name) { errEl.textContent = 'Укажите название группы'; return; }
  if (!groupSelectedMembers.size) { errEl.textContent = 'Добавьте хотя бы одного участника'; return; }
  try {
    const { chat } = await api('POST', '/chats/group', { name, memberIds: Array.from(groupSelectedMembers.keys()) });
    document.getElementById('modal-new-chat').classList.add('hidden');
    await loadChats();
    openChat(chat.id);
  } catch (err) {
    errEl.textContent = err.message;
  }
};

// ===================== ИСТОРИИ (STORIES) =====================

async function loadStories() {
  const { groups } = await api('GET', '/stories');
  state.storyGroups = groups;
  renderStoriesStrip();
}

function storyRingInnerHtml(name, avatarUrl, avatarColor, extraInner = '') {
  if (avatarUrl) {
    return `<div class="story-ring-inner has-photo"><img src="${avatarUrl}" alt="">${extraInner}</div>`;
  }
  const letter = escapeHtml(((name || '?').trim().charAt(0) || '?').toUpperCase());
  return `<div class="story-ring-inner avatar-color-${avatarColor || 'orange'}">${letter}${extraInner}</div>`;
}

function renderStoriesStrip() {
  const el = document.getElementById('stories-strip');
  const myGroup = state.storyGroups.find(g => g.authorId === state.user.id);
  const others = state.storyGroups.filter(g => g.authorId !== state.user.id);

  const myBubble = `
    <div class="story-bubble" data-author-id="${state.user.id}">
      <div class="story-ring ${myGroup && myGroup.hasUnseen ? 'unseen' : ''}">
        ${storyRingInnerHtml(state.user.fullName, state.user.avatarUrl, state.user.avatarColor, '<span class="story-add-badge" id="story-add-badge">+</span>')}
      </div>
      <div class="lbl">Моя история</div>
    </div>
  `;

  const otherBubbles = others.map(g => `
    <div class="story-bubble" data-author-id="${g.authorId}">
      <div class="story-ring ${g.hasUnseen ? 'unseen' : ''}">
        ${storyRingInnerHtml(g.authorName, g.authorAvatarUrl, g.authorAvatarColor)}
      </div>
      <div class="lbl">${escapeHtml(g.authorName.split(' ')[0])}</div>
    </div>
  `).join('');

  el.innerHTML = myBubble + otherBubbles;

  el.querySelectorAll('.story-bubble').forEach(bubble => {
    const authorId = Number(bubble.dataset.authorId);
    bubble.onclick = (e) => {
      if (authorId === state.user.id && !myGroup) {
        openStoryFilePicker();
        return;
      }
      openStoryViewer(authorId);
    };
  });
  const addBadge = document.getElementById('story-add-badge');
  if (addBadge) {
    addBadge.onclick = (e) => { e.stopPropagation(); openStoryFilePicker(); };
  }
}

function openStoryFilePicker() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const MAX_CLIENT_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_CLIENT_BYTES) { alert('Файл слишком большой (максимум ~15 МБ для прототипа)'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const caption = prompt('Подпись к истории (необязательно):', '') || '';
      try {
        await api('POST', '/stories', { text: caption, mediaData: reader.result });
        loadStories();
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function stopStoryAutoAdvance() {
  if (state.storyViewer.timer) {
    clearTimeout(state.storyViewer.timer);
    state.storyViewer.timer = null;
  }
}

function openStoryViewer(authorId) {
  const groupIdx = state.storyGroups.findIndex(g => g.authorId === authorId);
  if (groupIdx === -1) return;
  const group = state.storyGroups[groupIdx];
  let storyIdx = group.stories.findIndex(s => !s.viewedByMe);
  if (storyIdx === -1) storyIdx = 0;
  state.storyViewer.groupIdx = groupIdx;
  document.getElementById('modal-story-viewer').classList.remove('hidden');
  showStoryFrame(groupIdx, storyIdx);
}

async function showStoryFrame(groupIdx, storyIdx) {
  stopStoryAutoAdvance();
  const group = state.storyGroups[groupIdx];
  if (!group || storyIdx < 0) return;
  if (storyIdx >= group.stories.length) {
    // Переходим к следующему автору или закрываем просмотр, если это была последняя история
    const nextGroupIdx = groupIdx + 1;
    if (nextGroupIdx < state.storyGroups.length) {
      showStoryFrame(nextGroupIdx, 0);
    } else {
      closeStoryViewer();
    }
    return;
  }
  state.storyViewer.groupIdx = groupIdx;
  state.storyViewer.storyIdx = storyIdx;
  const story = group.stories[storyIdx];

  setAvatarElement(document.getElementById('story-viewer-avatar'), group.authorName, group.authorAvatarUrl, group.authorAvatarColor);
  document.getElementById('story-viewer-name').textContent = group.authorName;
  document.getElementById('story-viewer-time').textContent = formatDate(story.createdAt);
  document.getElementById('story-viewer-delete').classList.toggle('hidden', group.authorId !== state.user.id);

  const mediaEl = document.getElementById('story-viewer-media');
  if (story.mediaType === 'video') {
    mediaEl.innerHTML = `<video src="${story.mediaUrl}" ${appSettings.autoplayVideo ? 'autoplay' : ''} playsinline controls></video>`;
  } else if (story.mediaType === 'image') {
    mediaEl.innerHTML = `<img src="${story.mediaUrl}" alt="">`;
  } else {
    mediaEl.innerHTML = `<div class="no-media-bg">${escapeHtml(story.text)}</div>`;
  }
  const captionEl = document.getElementById('story-viewer-caption');
  if (story.mediaType && story.text) {
    captionEl.textContent = story.text;
    captionEl.classList.remove('hidden');
  } else {
    captionEl.classList.add('hidden');
  }

  const progressRow = document.getElementById('story-progress-row');
  progressRow.innerHTML = group.stories.map((s, i) => `
    <div class="seg ${i < storyIdx ? 'done' : ''}" data-i="${i}"><div class="seg-fill"></div></div>
  `).join('');

  if (!story.viewedByMe) {
    story.viewedByMe = true;
    api('POST', `/stories/${story.id}/view`).catch(() => {});
  }

  const DURATION = story.mediaType === 'video' ? 8000 : 5000;
  const activeSeg = progressRow.querySelector(`.seg[data-i="${storyIdx}"] .seg-fill`);
  if (activeSeg) {
    activeSeg.style.transition = `width ${DURATION}ms linear`;
    requestAnimationFrame(() => { activeSeg.style.width = '100%'; });
  }
  state.storyViewer.timer = setTimeout(() => showStoryFrame(groupIdx, storyIdx + 1), DURATION);
}

function closeStoryViewer() {
  stopStoryAutoAdvance();
  document.getElementById('modal-story-viewer').classList.add('hidden');
  document.getElementById('story-viewer-media').innerHTML = '';
  renderStoriesStrip();
}

document.getElementById('story-viewer-close').onclick = closeStoryViewer;
document.getElementById('story-nav-next').onclick = () => {
  const { groupIdx, storyIdx } = state.storyViewer;
  showStoryFrame(groupIdx, storyIdx + 1);
};
document.getElementById('story-nav-prev').onclick = () => {
  const { groupIdx, storyIdx } = state.storyViewer;
  if (storyIdx > 0) showStoryFrame(groupIdx, storyIdx - 1);
  else if (groupIdx > 0) {
    const prevGroup = state.storyGroups[groupIdx - 1];
    showStoryFrame(groupIdx - 1, prevGroup.stories.length - 1);
  }
};
document.getElementById('story-viewer-delete').onclick = async () => {
  const { groupIdx, storyIdx } = state.storyViewer;
  const story = state.storyGroups[groupIdx].stories[storyIdx];
  if (!confirm('Удалить эту историю?')) return;
  await api('DELETE', `/stories/${story.id}`);
  await loadStories();
  closeStoryViewer();
};

// ===================== ЗАДАНИЯ =====================

let cachedAssignments = [];
let assignmentsFilter = 'active';

async function loadAssignments() {
  const { assignments } = await api('GET', '/assignments');
  cachedAssignments = assignments;
  const listEl = document.getElementById('assignments-list');
  const tabsEl = document.getElementById('assignments-filter-tabs');
  tabsEl.classList.toggle('hidden', state.user.role !== 'student');

  if (state.user.role === 'student') {
    const pendingCount = assignments.filter(a => !a.mySubmission || a.mySubmission.status === 'pending').length;
    setShortcutCount('shortcut-count-assignments', pendingCount);
  } else {
    setShortcutCount('shortcut-count-assignments', assignments.length);
  }

  renderAssignmentsList();
}

function renderAssignmentsList() {
  const listEl = document.getElementById('assignments-list');
  let assignments = cachedAssignments;

  if (state.user.role === 'student') {
    assignments = assignments.filter(a => {
      const done = a.mySubmission && a.mySubmission.status === 'graded';
      return assignmentsFilter === 'completed' ? done : !done;
    });
  }

  if (!assignments.length) {
    listEl.innerHTML = state.user.role === 'student' && assignmentsFilter === 'completed'
      ? `<div class="muted">Пока нет выполненных заданий.</div>`
      : `<div class="muted">Пока нет заданий.</div>`;
    return;
  }
  const typeLabels = { text: '📝 Текстовое', test: '✅ Тест', ar: '📍 AR (демо)' };
  listEl.innerHTML = assignments.map(a => {
    let statusBadge = '';
    if (state.user.role === 'student') {
      if (!a.mySubmission) statusBadge = `<span class="badge none">Не сдано</span>`;
      else if (a.mySubmission.status === 'pending') statusBadge = `<span class="badge pending">На проверке</span>`;
      else statusBadge = `<span class="badge graded">Оценено · ${a.mySubmission.xpAwarded} XP${a.mySubmission.coinsAwarded ? ` · 🪙${a.mySubmission.coinsAwarded}` : ''}</span>`;
    }
    return `
      <div class="assignment-card" data-id="${a.id}">
        <h3>${escapeHtml(a.title)}</h3>
        <div class="assignment-meta">
          <span class="badge xp">+${a.xpReward} XP${a.coinsReward ? ` · 🪙${a.coinsReward}` : ''}</span>
          <span>${typeLabels[a.type] || a.type}</span>
          <span>Кому: ${escapeHtml(a.groupName)}</span>
          ${a.dueDate ? `<span>Дедлайн: ${a.dueDate}</span>` : ''}
          ${statusBadge}
        </div>
      </div>`;
  }).join('');
  listEl.querySelectorAll('.assignment-card').forEach(card => {
    card.onclick = () => openAssignmentDetail(Number(card.dataset.id));
  });
}

document.querySelectorAll('#assignments-filter-tabs .chat-filter-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('#assignments-filter-tabs .chat-filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    assignmentsFilter = tab.dataset.assignFilter;
    renderAssignmentsList();
  };
});

// ---------- Конструктор вопросов теста ----------

let qBlockSeq = 0;

function addOptionRow(optionsListEl) {
  const row = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `
    <input type="checkbox" data-role="o-correct" title="Правильный вариант">
    <input type="text" placeholder="Вариант ответа" data-role="o-text">
    <button type="button" class="option-remove-btn" data-remove-option>✕</button>
  `;
  optionsListEl.appendChild(row);
  row.querySelector('[data-remove-option]').onclick = () => {
    if (optionsListEl.children.length > 2) row.remove();
    else alert('Нужно минимум 2 варианта ответа');
  };
}

function createQuestionBlockEl(questionsContainer) {
  qBlockSeq++;
  const div = document.createElement('div');
  div.className = 'question-block';
  div.dataset.qid = qBlockSeq;
  div.innerHTML = `
    <div class="question-block-header">
      <span class="q-num">Вопрос</span>
      <button type="button" class="question-remove-btn" data-remove-question>Удалить вопрос</button>
    </div>
    <input type="text" class="question-text-input" placeholder="Текст вопроса" data-role="q-text">
    <div class="options-list" data-role="options-list"></div>
    <button type="button" class="option-add-btn" data-add-option>+ Добавить вариант</button>
  `;
  questionsContainer.appendChild(div);
  const optionsListEl = div.querySelector('[data-role="options-list"]');
  addOptionRow(optionsListEl);
  addOptionRow(optionsListEl);
  div.querySelector('[data-remove-question]').onclick = () => {
    if (questionsContainer.children.length > 1) { div.remove(); renumberQuestions(questionsContainer); }
    else alert('В тесте должен остаться хотя бы один вопрос');
  };
  div.querySelector('[data-add-option]').onclick = () => addOptionRow(optionsListEl);
  renumberQuestions(questionsContainer);
}

function renumberQuestions(questionsContainer) {
  questionsContainer.querySelectorAll('.question-block').forEach((el, i) => {
    el.querySelector('.q-num').textContent = `Вопрос ${i + 1}`;
  });
}

function resetQuestionBuilder() {
  const container = document.getElementById('assign-questions');
  container.innerHTML = '';
  createQuestionBlockEl(container);
}

function collectQuestionsFromBuilder() {
  const container = document.getElementById('assign-questions');
  return Array.from(container.querySelectorAll('.question-block')).map(block => ({
    text: block.querySelector('[data-role="q-text"]').value,
    options: Array.from(block.querySelectorAll('.option-row')).map(row => ({
      text: row.querySelector('[data-role="o-text"]').value,
      correct: row.querySelector('[data-role="o-correct"]').checked
    }))
  }));
}

document.getElementById('assign-add-question').onclick = () => {
  createQuestionBlockEl(document.getElementById('assign-questions'));
};

// ---------- Тип задания ----------

let currentAssignType = 'text';

document.querySelectorAll('#assign-type-picker .type-option').forEach(btn => {
  btn.onclick = () => {
    currentAssignType = btn.dataset.type;
    document.querySelectorAll('#assign-type-picker .type-option').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('assign-text-pane').classList.toggle('hidden', currentAssignType !== 'text');
    document.getElementById('assign-test-pane').classList.toggle('hidden', currentAssignType !== 'test');
    document.getElementById('assign-ar-pane').classList.toggle('hidden', currentAssignType !== 'ar');
    if (currentAssignType === 'ar') initAssignArMapIfNeeded();
  };
});

// ---------- AR: выбор точки на карте + фото ----------

let assignArMap = null;
let assignArMarker = null;
let assignArPickedLatLng = null;
let pendingAssignArPhotoDataUrl = null;

function initAssignArMapIfNeeded() {
  if (typeof ymaps === 'undefined') {
    document.getElementById('assign-ar-map').innerHTML = `<div class="muted" style="padding:16px;">Карта не загрузилась. Проверьте API-ключ Яндекс.Карт в index.html и подключение к интернету.</div>`;
    return;
  }
  ymaps.ready(() => {
    if (assignArMap) { setTimeout(() => assignArMap.container.fitToViewport(), 50); return; }
    assignArMap = new ymaps.Map('assign-ar-map', {
      center: [55.751244, 37.618423], zoom: 12, controls: ['zoomControl']
    });
    assignArMap.events.add('click', (e) => {
      const coords = e.get('coords');
      setAssignArPoint(coords[0], coords[1]);
    });
    setTimeout(() => assignArMap.container.fitToViewport(), 50);
  });
}

function setAssignArPoint(lat, lng) {
  assignArPickedLatLng = { lat, lng };
  document.getElementById('assign-ar-coords-label').textContent = `Точка: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  if (assignArMarker) {
    assignArMarker.geometry.setCoordinates([lat, lng]);
  } else {
    assignArMarker = new ymaps.Placemark([lat, lng], {}, { preset: 'islands#redIcon' });
    assignArMap.geoObjects.add(assignArMarker);
  }
  assignArMap.setCenter([lat, lng], 17);
}

document.getElementById('assign-ar-locate-btn').onclick = () => {
  if (!navigator.geolocation) { alert('Геолокация не поддерживается этим браузером'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => setAssignArPoint(pos.coords.latitude, pos.coords.longitude),
    (err) => alert('Не удалось получить местоположение: ' + err.message)
  );
};

document.getElementById('assign-ar-photo-input').addEventListener('change', () => {
  const input = document.getElementById('assign-ar-photo-input');
  const file = input.files[0];
  if (!file) return;
  const MAX_CLIENT_BYTES = 8 * 1024 * 1024;
  if (file.size > MAX_CLIENT_BYTES) { alert('Файл слишком большой (максимум ~8 МБ)'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    pendingAssignArPhotoDataUrl = reader.result;
    document.getElementById('assign-ar-photo-preview').innerHTML = `<img src="${pendingAssignArPhotoDataUrl}" alt="">`;
  };
  reader.readAsDataURL(file);
});

// ---------- Кому назначить: группе или выбранным студентам ----------

let assignTargetType = 'group';
let assignSelectedStudents = new Map();

function switchAssignTarget(type) {
  assignTargetType = type;
  document.getElementById('assign-target-group-tab').classList.toggle('active', type === 'group');
  document.getElementById('assign-target-students-tab').classList.toggle('active', type === 'students');
  document.getElementById('assign-target-group-pane').classList.toggle('hidden', type !== 'group');
  document.getElementById('assign-target-students-pane').classList.toggle('hidden', type !== 'students');
}
document.getElementById('assign-target-group-tab').onclick = () => switchAssignTarget('group');
document.getElementById('assign-target-students-tab').onclick = () => switchAssignTarget('students');

function renderAssignSelectedStudents() {
  const el = document.getElementById('assign-student-selected');
  el.innerHTML = Array.from(assignSelectedStudents.values()).map(u => `
    <span class="chip" data-id="${u.id}">${escapeHtml(u.fullName)}<button type="button" data-remove="${u.id}">✕</button></span>
  `).join('');
  el.querySelectorAll('[data-remove]').forEach(btn => {
    btn.onclick = () => {
      assignSelectedStudents.delete(Number(btn.dataset.remove));
      renderAssignSelectedStudents();
    };
  });
}

document.getElementById('assign-student-search').addEventListener('input', (e) => {
  searchUsers(e.target.value, document.getElementById('assign-student-results'), (u) => {
    assignSelectedStudents.set(u.id, u);
    renderAssignSelectedStudents();
    document.getElementById('assign-student-search').value = '';
    document.getElementById('assign-student-results').innerHTML = '';
  }, 'student');
});

// ---------- Открытие/создание/сброс модалки нового задания ----------

document.getElementById('btn-new-assignment').onclick = async () => {
  await loadGroupsIntoSelect(document.getElementById('assign-group'));
  document.getElementById('assign-title').value = '';
  document.getElementById('assign-desc').value = '';
  document.getElementById('assign-ar-desc').value = '';
  document.getElementById('assign-ar-label').value = '';
  document.getElementById('assign-ar-photo-input').value = '';
  document.getElementById('assign-ar-photo-preview').innerHTML = `<span class="muted">Фото точки интереса не выбрано</span>`;
  pendingAssignArPhotoDataUrl = null;
  assignArPickedLatLng = null;
  document.getElementById('assign-ar-coords-label').textContent = 'Точка не выбрана — кликните на карте';
  if (assignArMarker && assignArMap) { assignArMap.geoObjects.remove(assignArMarker); assignArMarker = null; }
  document.getElementById('assign-xp').value = 20;
  document.getElementById('assign-coins').value = 10;
  document.getElementById('assign-due').value = '';
  document.getElementById('assign-error').textContent = '';

  currentAssignType = 'text';
  document.querySelectorAll('#assign-type-picker .type-option').forEach(b => b.classList.toggle('active', b.dataset.type === 'text'));
  document.getElementById('assign-text-pane').classList.remove('hidden');
  document.getElementById('assign-test-pane').classList.add('hidden');
  document.getElementById('assign-ar-pane').classList.add('hidden');
  resetQuestionBuilder();

  assignSelectedStudents = new Map();
  renderAssignSelectedStudents();
  document.getElementById('assign-student-search').value = '';
  document.getElementById('assign-student-results').innerHTML = '';
  switchAssignTarget('group');

  document.getElementById('modal-new-assignment').classList.remove('hidden');
};
document.getElementById('assign-cancel').onclick = () => {
  document.getElementById('modal-new-assignment').classList.add('hidden');
};
document.getElementById('assign-cancel-x').onclick = () => {
  document.getElementById('modal-new-assignment').classList.add('hidden');
};

document.getElementById('form-new-assignment').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('assign-error');
  errEl.textContent = '';

  const title = document.getElementById('assign-title').value.trim();
  const xpReward = document.getElementById('assign-xp').value;
  const coinsReward = document.getElementById('assign-coins').value;
  const dueDate = document.getElementById('assign-due').value;

  const assignedTo = assignTargetType === 'students'
    ? { type: 'students', studentIds: Array.from(assignSelectedStudents.keys()) }
    : { type: 'group', groupId: document.getElementById('assign-group').value };

  const payload = { title, type: currentAssignType, assignedTo, xpReward, coinsReward, dueDate };

  if (currentAssignType === 'text') {
    payload.description = document.getElementById('assign-desc').value.trim();
  } else if (currentAssignType === 'test') {
    payload.questions = collectQuestionsFromBuilder();
  } else if (currentAssignType === 'ar') {
    if (!assignArPickedLatLng) { errEl.textContent = 'Отметьте точку на карте (или используйте кнопку «моё местоположение»)'; return; }
    payload.description = document.getElementById('assign-ar-desc').value.trim();
    payload.arLocation = {
      label: document.getElementById('assign-ar-label').value.trim(),
      lat: assignArPickedLatLng.lat,
      lng: assignArPickedLatLng.lng
    };
    payload.imageMediaData = pendingAssignArPhotoDataUrl;
  }

  try {
    await api('POST', '/assignments', payload);
    document.getElementById('modal-new-assignment').classList.add('hidden');
    loadAssignments();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// ---------- Просмотр задания: текстовое / тест / AR-заглушка ----------

async function openAssignmentDetail(id) {
  const { assignments } = await api('GET', '/assignments');
  const a = assignments.find(x => x.id === id);
  if (!a) return;

  const modal = document.getElementById('modal-assignment-detail');
  const content = document.getElementById('detail-content');
  const watermark = `${state.user.fullName} · ${new Date().toLocaleString('ru-RU')}`;
  const typeLabel = { text: '📝 Текстовое', test: '✅ Тест', ar: '📍 AR-точка интереса' }[a.type] || a.type;

  let bodyHtml = `
    <h2>${escapeHtml(a.title)}</h2>
    <div class="assignment-meta" style="margin-bottom:12px;">
      <span class="badge xp">+${a.xpReward} XP${a.coinsReward ? ` · 🪙${a.coinsReward}` : ''}</span>
      <span>${typeLabel}</span>
      <span>Кому: ${escapeHtml(a.groupName)}</span>
      ${a.dueDate ? `<span>Дедлайн: ${a.dueDate}</span>` : ''}
    </div>
  `;

  if (a.type === 'text') {
    bodyHtml += `
      <div class="protected-content" id="assign-desc-protected">
        <div style="white-space:pre-wrap; font-size:14px; line-height:1.5;">${escapeHtml(a.description)}</div>
      </div>
      <div class="protection-note">
        🔒 Копирование текста задания и выделение отключены. Обратите внимание: скриншот
        средствами операционной системы браузер заблокировать не может — это техническое
        ограничение любого сайта, а не только этого прототипа.
      </div>
    `;
  } else if (a.type === 'ar') {
    const loc = a.arLocation || {};
    bodyHtml += `
      <div class="ar-detail-card">
        ${a.imageUrl ? `<img class="ar-detail-photo" src="${a.imageUrl}" alt="">` : ''}
        <div class="ar-detail-body">
          <div class="ar-detail-label">Что нужно найти</div>
          <div style="font-size:16px; font-weight:700; margin-bottom:8px;">📍 ${escapeHtml(loc.label || a.title)}</div>
          <div style="white-space:pre-wrap; font-size:14px; line-height:1.5;">${escapeHtml(a.description)}</div>
        </div>
      </div>
    `;
  }

  if (state.user.role === 'student') {
    if (a.type === 'test') {
      bodyHtml += renderQuizHtml(a);
    } else if (a.type === 'text') {
      const mySub = a.mySubmission;
      bodyHtml += `
        <div class="submission-box">
          <h3>Ваш ответ</h3>
          <textarea id="submission-text" placeholder="Введите решение...">${mySub ? escapeHtml(mySub.text) : ''}</textarea>
          <button class="primary-btn" id="submit-answer-btn" style="margin-top:8px;">
            ${mySub ? 'Отправить заново' : 'Отправить на проверку'}
          </button>
          ${mySub && mySub.status === 'graded' ? `<div class="muted" style="margin-top:8px;">Оценка: ${mySub.grade || '—'} · Начислено ${mySub.xpAwarded} XP${mySub.coinsAwarded ? ` · 🪙 ${mySub.coinsAwarded}` : ''}</div>` : ''}
        </div>
      `;
    } else if (a.type === 'ar') {
      const mySub = a.mySubmission;
      if (mySub && mySub.status === 'graded') {
        bodyHtml += `
          <div class="quiz-result-banner">
            <div class="score">✅</div>
            <div class="muted">Точка найдена · начислено ${mySub.xpAwarded} XP${mySub.coinsAwarded ? ` · 🪙 ${mySub.coinsAwarded}` : ''}</div>
          </div>
        `;
      } else {
        bodyHtml += `
          <div class="submission-box">
            <div class="ar-distance-row" id="ar-distance-row">
              <div>📡</div>
              <div>
                <div class="ar-distance-value" id="ar-distance-value">—</div>
                <div class="muted" id="ar-distance-hint">Определяем ваше местоположение...</div>
              </div>
            </div>
            <button class="primary-btn" id="ar-open-camera-btn" style="width:100%; margin-top:14px;">📷 Открыть камеру</button>
          </div>
        `;
      }
    }
  } else {
    bodyHtml += `
      <div class="submission-box">
        <h3>Ответы студентов</h3>
        <div id="submissions-list">Загрузка...</div>
        <button class="secondary-btn" id="delete-assignment-btn" style="margin-top:12px;">Удалить задание</button>
      </div>
    `;
  }

  content.innerHTML = bodyHtml;
  modal.classList.remove('hidden');

  if (a.type === 'text') {
    const protectedEl = document.getElementById('assign-desc-protected');
    protectElement(protectedEl, watermark);
    if (state.unguardWindow) state.unguardWindow();
    state.unguardWindow = installWindowGuards(() => [protectedEl]);
  } else if (state.unguardWindow) {
    state.unguardWindow();
    state.unguardWindow = null;
  }

  if (state.user.role === 'student') {
    if (a.type === 'test') {
      wireQuizForm(a, id, modal);
    } else if (a.type === 'text') {
      document.getElementById('submit-answer-btn').onclick = async () => {
        const text = document.getElementById('submission-text').value.trim();
        if (!text) return alert('Введите ответ');
        try {
          await api('POST', `/assignments/${id}/submit`, { text });
          alert('Ответ отправлен на проверку');
          modal.classList.add('hidden');
          loadAssignments();
        } catch (err) {
          alert(err.message);
        }
      };
    } else if (a.type === 'ar' && document.getElementById('ar-open-camera-btn')) {
      wireArDetailFlow(a, id, modal);
    }
  } else {
    const { submissions } = await api('GET', `/assignments/${id}/submissions`);
    const subsEl = document.getElementById('submissions-list');
    if (!submissions.length) {
      subsEl.innerHTML = `<div class="muted">Пока никто не сдал.</div>`;
    } else if (a.type === 'test') {
      subsEl.innerHTML = submissions.map(s => `
        <div class="sub-item">
          <b>${escapeHtml(s.studentName)}</b>
          <div class="muted" style="margin-top:4px;">
            Результат теста: ${s.autoScore}% верных ответов · начислено ${s.xpAwarded} XP${s.coinsAwarded ? ` · 🪙 ${s.coinsAwarded}` : ''} (проверено автоматически)
          </div>
        </div>
      `).join('');
    } else if (a.type === 'ar') {
      subsEl.innerHTML = submissions.map(s => `
        <div class="sub-item">
          <b>${escapeHtml(s.studentName)}</b>
          <div class="muted" style="margin-top:4px;">
            📍 Нашёл точку интереса ${formatDate(s.gradedAt)} · начислено ${s.xpAwarded} XP${s.coinsAwarded ? ` · 🪙 ${s.coinsAwarded}` : ''}
          </div>
        </div>
      `).join('');
    } else {
      subsEl.innerHTML = submissions.map(s => `
        <div class="sub-item">
          <b>${escapeHtml(s.studentName)}</b>
          <div style="font-size:13px; margin-top:4px; white-space:pre-wrap;">${escapeHtml(s.text)}</div>
          <div class="muted" style="margin-top:4px;">
            Статус: ${s.status === 'graded' ? `Оценено (${s.grade || '—'}, ${s.xpAwarded} XP${s.coinsAwarded ? `, 🪙 ${s.coinsAwarded}` : ''})` : 'На проверке'}
          </div>
          <div class="grade-form">
            <input type="text" placeholder="Оценка" class="grade-input" data-id="${s.id}">
            <input type="number" placeholder="XP" class="xp-input" data-id="${s.id}" value="${a.xpReward}">
            <input type="number" placeholder="Монетки" class="coins-input" data-id="${s.id}" value="${a.coinsReward || 0}">
            <button class="grade-btn" data-id="${s.id}">Оценить</button>
          </div>
        </div>
      `).join('');
      subsEl.querySelectorAll('.grade-btn').forEach(btn => {
        btn.onclick = async () => {
          const sid = btn.dataset.id;
          const grade = subsEl.querySelector(`.grade-input[data-id="${sid}"]`).value;
          const xpAwarded = subsEl.querySelector(`.xp-input[data-id="${sid}"]`).value;
          const coinsAwarded = subsEl.querySelector(`.coins-input[data-id="${sid}"]`).value;
          await api('POST', `/submissions/${sid}/grade`, { grade, xpAwarded, coinsAwarded });
          openAssignmentDetail(id);
        };
      });
    }
    document.getElementById('delete-assignment-btn').onclick = async () => {
      if (!confirm('Удалить задание?')) return;
      await api('DELETE', `/assignments/${id}`);
      modal.classList.add('hidden');
      loadAssignments();
    };
  }
}

// Отрисовка теста для прохождения студентом (или результатов, если уже пройден)
function renderQuizHtml(a) {
  const mySub = a.mySubmission;
  const alreadyGraded = mySub && mySub.status === 'graded';
  const questionsHtml = (a.questions || []).map((q, qi) => {
    const myAnswers = new Set((alreadyGraded && mySub.answers && mySub.answers[q.id]) ? mySub.answers[q.id].map(String) : []);
    const optionsHtml = q.options.map(o => {
      let cls = '';
      if (alreadyGraded) {
        const chosen = myAnswers.has(String(o.id));
        if (o.correct) cls = 'is-correct';
        else if (chosen && !o.correct) cls = 'is-incorrect';
      }
      return `
        <label class="quiz-option ${cls}">
          <input type="checkbox" data-qid="${q.id}" data-oid="${o.id}" ${myAnswers.has(String(o.id)) ? 'checked' : ''} ${alreadyGraded ? 'disabled' : ''}>
          <span>${escapeHtml(o.text)}</span>
        </label>
      `;
    }).join('');
    return `
      <div class="quiz-question">
        <div class="quiz-question-text">${qi + 1}. ${escapeHtml(q.text)}</div>
        ${optionsHtml}
      </div>
    `;
  }).join('');

  const resultBanner = alreadyGraded ? `
    <div class="quiz-result-banner">
      <div class="score">${mySub.autoScore}%</div>
      <div class="muted">Правильных ответов · начислено ${mySub.xpAwarded} XP${mySub.coinsAwarded ? ` · 🪙 ${mySub.coinsAwarded}` : ''}</div>
    </div>
  ` : '';

  return `
    <div class="submission-box">
      <h3>Тест</h3>
      ${resultBanner}
      <div id="quiz-questions">${questionsHtml}</div>
      ${!alreadyGraded ? `<button class="primary-btn" id="submit-quiz-btn" style="margin-top:8px;">Отправить ответы</button>` : ''}
    </div>
  `;
}

function wireQuizForm(a, id, modal) {
  const btn = document.getElementById('submit-quiz-btn');
  if (!btn) return; // уже пройден — только просмотр результата
  btn.onclick = async () => {
    const answers = {};
    document.querySelectorAll('#quiz-questions input[type="checkbox"]:checked').forEach(cb => {
      const qid = cb.dataset.qid;
      if (!answers[qid]) answers[qid] = [];
      answers[qid].push(cb.dataset.oid);
    });
    try {
      const { correctCount, totalQuestions, user } = await api('POST', `/assignments/${id}/submit`, { answers });
      if (user) { state.user = user; renderProfile(); renderFeedProgress(); updateCoinBalanceDisplay(); }
      alert(`Тест пройден: ${correctCount} из ${totalQuestions} верно`);
      modal.classList.add('hidden');
      loadAssignments();
    } catch (err) {
      alert(err.message);
    }
  };
}

// Расстояние между двумя точками в метрах (та же формула, что и на сервере — для честного отображения студенту)
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinA = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sinA));
}

let arWatchId = null;
let arLastCoords = null;

function wireArDetailFlow(a, id, modal) {
  const loc = a.arLocation;
  const distEl = document.getElementById('ar-distance-value');
  const hintEl = document.getElementById('ar-distance-hint');
  const rowEl = document.getElementById('ar-distance-row');

  if (arWatchId !== null) navigator.geolocation.clearWatch(arWatchId);
  arLastCoords = null;

  if (!navigator.geolocation) {
    hintEl.textContent = 'Геолокация недоступна в этом браузере — можно всё равно открыть камеру.';
  } else {
    arWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        arLastCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (loc) {
          const d = Math.round(haversineMeters(loc.lat, loc.lng, arLastCoords.lat, arLastCoords.lng));
          distEl.textContent = d < 1000 ? `${d} м` : `${(d / 1000).toFixed(1)} км`;
          const close = d <= (loc.radiusMeters || 60);
          rowEl.classList.toggle('close', close);
          hintEl.textContent = close ? 'Вы рядом! Можно открывать камеру.' : 'Идите в сторону точки на карте';
        }
      },
      () => { hintEl.textContent = 'Не удалось определить местоположение — можно всё равно открыть камеру.'; },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  document.getElementById('ar-open-camera-btn').onclick = () => openArCamera(a, id, modal);
}

async function openArCamera(a, id, modal) {
  const overlay = document.createElement('div');
  overlay.className = 'ar-camera-overlay';
  overlay.innerHTML = `
    <button class="ar-camera-close" id="ar-camera-close">✕</button>
    <video class="ar-camera-video" id="ar-camera-video" autoplay playsinline muted></video>
    <div class="ar-camera-card">
      <div class="ar-camera-pin">📍</div>
      <div class="ar-camera-title">${escapeHtml((a.arLocation && a.arLocation.label) || a.title)}</div>
      <div class="ar-camera-comment">${escapeHtml(a.description)}</div>
      <button class="ar-camera-confirm-btn" id="ar-camera-confirm-btn">Я нашёл(-ла) это место — забрать награду</button>
      <div class="ar-camera-hint">Наведите камеру на объект и прочитайте комментарий, затем подтвердите</div>
    </div>
  `;
  document.body.appendChild(overlay);

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    document.getElementById('ar-camera-video').srcObject = stream;
  } catch (err) {
    document.getElementById('ar-camera-hint').textContent = 'Камера недоступна (нет разрешения или устройства) — но комментарий уже прочитан, можно подтвердить.';
  }

  function closeCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    overlay.remove();
  }
  document.getElementById('ar-camera-close').onclick = closeCamera;

  document.getElementById('ar-camera-confirm-btn').onclick = async () => {
    try {
      const body = arLastCoords ? { lat: arLastCoords.lat, lng: arLastCoords.lng } : {};
      const { user } = await api('POST', `/assignments/${id}/submit`, body);
      if (user) { state.user = user; renderProfile(); renderFeedProgress(); updateCoinBalanceDisplay(); }
      closeCamera();
      alert('Точка засчитана! Награда начислена.');
      modal.classList.add('hidden');
      loadAssignments();
    } catch (err) {
      alert(err.message);
    }
  };
}

document.getElementById('detail-close').onclick = () => {
  document.getElementById('modal-assignment-detail').classList.add('hidden');
  if (state.unguardWindow) { state.unguardWindow(); state.unguardWindow = null; }
  if (arWatchId !== null) { navigator.geolocation.clearWatch(arWatchId); arWatchId = null; }
};

// ===================== ПРОФИЛЬ =====================

document.getElementById('find-person-input').addEventListener('input', (e) => {
  searchUsers(e.target.value, document.getElementById('find-person-results'), (u) => {
    document.getElementById('find-person-input').value = '';
    document.getElementById('find-person-results').innerHTML = '';
    openUserProfile(u.id);
  });
});

async function loadAchievements() {
  const { achievements, unlockedCount, totalCount } = await api('GET', '/achievements');
  document.getElementById('achievements-progress').textContent = `${unlockedCount} / ${totalCount}`;
  document.getElementById('achievements-grid').innerHTML = achievements.map(a => `
    <div class="achievement-card ${a.unlocked ? 'unlocked' : ''}">
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-title">${escapeHtml(a.title)}</div>
      <div class="achievement-desc">${escapeHtml(a.desc)}</div>
      <div class="achievement-bar"><div class="achievement-bar-fill" style="width:${Math.round(a.progress / a.target * 100)}%;"></div></div>
      <div class="achievement-progress-text">${a.progress} / ${a.target}</div>
    </div>
  `).join('');
}

function renderProfile() {
  const u = state.user;
  setAvatarElement(document.getElementById('profile-avatar'), u.fullName, u.avatarUrl, u.avatarColor);
  document.getElementById('profile-name').textContent = u.fullName;
  document.getElementById('profile-role').textContent = roleLabel(u.role);
  const group = state.groups.find(g => g.id === u.groupId);
  document.getElementById('profile-group').textContent = group ? `Группа: ${group.name}` : '';

  document.getElementById('profile-level').textContent = u.level;
  const xpIntoLevel = u.xp % 100;
  document.getElementById('profile-xp-text').textContent = `${xpIntoLevel} / 100 XP`;
  document.getElementById('profile-xp-fill').style.width = xpIntoLevel + '%';

  document.getElementById('profile-stat-level').textContent = u.level;
  document.getElementById('profile-stat-xp').textContent = u.xp;
  document.getElementById('profile-stat-coins').textContent = `🪙 ${u.coins || 0}`;

  const sinceYear = u.createdAt ? new Date(u.createdAt).getFullYear() : new Date().getFullYear();
  document.getElementById('profile-since-pill').textContent = `С ${sinceYear} года`;
  document.getElementById('profile-bio-text').textContent = u.bio && u.bio.trim() ? u.bio : 'Пока нет описания профиля';
}

document.getElementById('profile-bio-edit-btn').onclick = () => {
  document.getElementById('profile-bio-input').value = state.user.bio || '';
  document.getElementById('profile-bio-view').classList.add('hidden');
  document.getElementById('profile-bio-form').classList.remove('hidden');
};
document.getElementById('profile-bio-cancel').onclick = () => {
  document.getElementById('profile-bio-form').classList.add('hidden');
  document.getElementById('profile-bio-view').classList.remove('hidden');
};
document.getElementById('profile-bio-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bio = document.getElementById('profile-bio-input').value.trim();
  try {
    const { user } = await api('PATCH', '/users/me', { bio });
    state.user = user;
    document.getElementById('profile-bio-form').classList.add('hidden');
    document.getElementById('profile-bio-view').classList.remove('hidden');
    renderProfile();
  } catch (err) {
    alert(err.message);
  }
});

// ===================== АВАТАР =====================

let pendingAvatarDataUrl = null;

function switchAvatarTab(tab) {
  document.getElementById('avatar-tab-photo').classList.toggle('active', tab === 'photo');
  document.getElementById('avatar-tab-color').classList.toggle('active', tab === 'color');
  document.getElementById('avatar-photo-pane').classList.toggle('hidden', tab !== 'photo');
  document.getElementById('avatar-color-pane').classList.toggle('hidden', tab !== 'color');
}
document.getElementById('avatar-tab-photo').onclick = () => switchAvatarTab('photo');
document.getElementById('avatar-tab-color').onclick = () => switchAvatarTab('color');

document.getElementById('profile-avatar-edit-btn').onclick = () => {
  pendingAvatarDataUrl = null;
  document.getElementById('avatar-file-input').value = '';
  document.getElementById('avatar-upload-preview').innerHTML = `<span class="muted">Фото не выбрано</span>`;
  document.getElementById('avatar-photo-error').textContent = '';
  document.getElementById('avatar-color-error').textContent = '';
  renderAvatarColorGrid();
  switchAvatarTab('photo');
  document.getElementById('modal-avatar-picker').classList.remove('hidden');
};
document.getElementById('avatar-picker-close').onclick = () => {
  document.getElementById('modal-avatar-picker').classList.add('hidden');
};

document.getElementById('avatar-file-input').addEventListener('change', () => {
  const input = document.getElementById('avatar-file-input');
  const file = input.files[0];
  if (!file) return;
  const MAX_CLIENT_BYTES = 8 * 1024 * 1024;
  if (file.size > MAX_CLIENT_BYTES) {
    alert('Файл слишком большой (максимум ~8 МБ для аватара)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingAvatarDataUrl = reader.result;
    document.getElementById('avatar-upload-preview').innerHTML = `<img src="${pendingAvatarDataUrl}" alt="">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('avatar-photo-save').onclick = async () => {
  const errEl = document.getElementById('avatar-photo-error');
  errEl.textContent = '';
  if (!pendingAvatarDataUrl) { errEl.textContent = 'Сначала выберите файл'; return; }
  try {
    const { user } = await api('POST', '/users/me/avatar', { mediaData: pendingAvatarDataUrl });
    state.user = user;
    renderProfile();
    document.getElementById('modal-avatar-picker').classList.add('hidden');
  } catch (err) {
    errEl.textContent = err.message;
  }
};

function renderAvatarColorGrid() {
  const grid = document.getElementById('avatar-color-grid');
  grid.innerHTML = AVATAR_COLORS.map(c => `
    <button type="button" class="avatar-color-swatch avatar-color-${c} ${state.user.avatarColor === c && !state.user.avatarUrl ? 'selected' : ''}" data-color="${c}" title="${AVATAR_COLOR_LABELS[c]}">
      ${escapeHtml((state.user.fullName || '?').trim().charAt(0).toUpperCase())}
    </button>
  `).join('');
  grid.querySelectorAll('.avatar-color-swatch').forEach(btn => {
    btn.onclick = async () => {
      const errEl = document.getElementById('avatar-color-error');
      errEl.textContent = '';
      try {
        const { user } = await api('POST', '/users/me/avatar', { color: btn.dataset.color });
        state.user = user;
        renderProfile();
        document.getElementById('modal-avatar-picker').classList.add('hidden');
      } catch (err) {
        errEl.textContent = err.message;
      }
    };
  });
}

document.getElementById('avatar-reset-btn').onclick = async () => {
  const { user } = await api('DELETE', '/users/me/avatar');
  state.user = user;
  renderProfile();
  document.getElementById('modal-avatar-picker').classList.add('hidden');
};

// ===================== ЖАЛОБЫ НА ПОЛЬЗОВАТЕЛЕЙ =====================

let reportTarget = { userId: null, contextType: null, contextId: null };

function openReportModal(userId, userName, contextType, contextId) {
  reportTarget = { userId, contextType, contextId };
  document.getElementById('report-target-label').textContent = `Жалоба на пользователя: ${userName}`;
  document.getElementById('report-reason').value = '';
  document.getElementById('report-error').textContent = '';
  document.getElementById('modal-report').classList.remove('hidden');
}
document.getElementById('report-close').onclick = () => document.getElementById('modal-report').classList.add('hidden');
document.getElementById('report-cancel').onclick = () => document.getElementById('modal-report').classList.add('hidden');

document.getElementById('report-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('report-error');
  errEl.textContent = '';
  const reason = document.getElementById('report-reason').value.trim();
  if (!reason) { errEl.textContent = 'Опишите причину жалобы'; return; }
  try {
    await api('POST', '/reports', {
      reportedUserId: reportTarget.userId, reason,
      contextType: reportTarget.contextType, contextId: reportTarget.contextId
    });
    document.getElementById('modal-report').classList.add('hidden');
    alert('Жалоба отправлена администрации.');
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// ===================== НАСТРОЙКИ (вкладка) =====================

function renderSettingsView() {
  document.querySelectorAll('#settings-fontsize-row .settings-option-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fontsize === appSettings.fontSize);
    b.onclick = () => { appSettings.fontSize = b.dataset.fontsize; saveSettings(); applySettings(); renderSettingsView(); };
  });
  document.querySelectorAll('#settings-theme-row .settings-option-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === appSettings.theme);
    b.onclick = () => { appSettings.theme = b.dataset.theme; saveSettings(); applySettings(); renderSettingsView(); };
  });
  document.querySelectorAll('#settings-density-row .settings-option-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.density === appSettings.density);
    b.onclick = () => { appSettings.density = b.dataset.density; saveSettings(); applySettings(); renderSettingsView(); };
  });

  const colorRow = document.getElementById('settings-accent-row');
  colorRow.innerHTML = Object.keys(ACCENT_PALETTES).map(c => `
    <button type="button" class="settings-color-swatch avatar-color-${c} ${appSettings.accentColor === c ? 'active' : ''}" data-color="${c}" title="${AVATAR_COLOR_LABELS[c]}"></button>
  `).join('');
  colorRow.querySelectorAll('.settings-color-swatch').forEach(btn => {
    btn.onclick = () => { appSettings.accentColor = btn.dataset.color; saveSettings(); applySettings(); renderSettingsView(); };
  });

  document.getElementById('settings-autoplay').checked = appSettings.autoplayVideo;
  document.getElementById('settings-reduce-motion').checked = appSettings.reduceMotion;
}

document.getElementById('settings-autoplay').addEventListener('change', (e) => {
  appSettings.autoplayVideo = e.target.checked;
  saveSettings();
});
document.getElementById('settings-reduce-motion').addEventListener('change', (e) => {
  appSettings.reduceMotion = e.target.checked;
  saveSettings();
  applySettings();
});
document.getElementById('settings-reset-btn').onclick = () => {
  if (!confirm('Сбросить все настройки внешнего вида к значениям по умолчанию?')) return;
  appSettings = { ...DEFAULT_SETTINGS };
  saveSettings();
  applySettings();
  renderSettingsView();
};

// ===================== АДМИН =====================

document.getElementById('form-new-teacher').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('teacher-fullname').value.trim();
  const username = document.getElementById('teacher-username').value.trim();
  const password = document.getElementById('teacher-password').value;
  try {
    await api('POST', '/admin/teachers', { fullName, username, password });
    e.target.reset();
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('form-new-group').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('group-name').value.trim();
  try {
    await api('POST', '/admin/groups', { name });
    e.target.reset();
    loadChats();
    const { groups } = await api('GET', '/groups');
    state.groups = groups;
  } catch (err) {
    alert(err.message);
  }
});

async function loadAdminUsers() {
  const { users } = await api('GET', '/admin/users');
  const el = document.getElementById('admin-users-table');
  el.innerHTML = `
    <table class="users-table">
      <thead><tr><th>ФИО</th><th>Логин</th><th>Роль</th><th>Онлайн</th><th>Уровень</th><th>XP</th><th></th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${escapeHtml(u.fullName)}</td>
            <td>${escapeHtml(u.username)}</td>
            <td>
              <select class="role-select" data-role-for="${u.id}" data-prev="${u.role}" ${u.id === state.user.id ? 'disabled title="Нельзя изменить свою роль"' : ''}>
                <option value="student" ${u.role === 'student' ? 'selected' : ''}>Студент</option>
                <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Преподаватель</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Админ</option>
              </select>
            </td>
            <td>${u.online ? '<span class="online-label">Онлайн</span>' : '<span class="offline-label">Не в сети</span>'}</td>
            <td>${u.level}</td>
            <td>${u.xp}</td>
            <td>${u.role !== 'admin' ? `<button class="del-btn" data-id="${u.id}">Удалить</button>` : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  el.querySelectorAll('.del-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить пользователя?')) return;
      await api('DELETE', `/admin/users/${btn.dataset.id}`);
      loadAdminUsers();
    };
  });
  el.querySelectorAll('.role-select').forEach(sel => {
    sel.onchange = () => changeUserRole(Number(sel.dataset.roleFor), sel.value, sel, sel.dataset.prev);
  });
}

async function changeUserRole(userId, newRole, selectEl, previousRole) {
  if (!confirm(`Изменить роль пользователя на «${roleLabel(newRole)}»?`)) {
    selectEl.value = previousRole;
    return;
  }
  let groupId = null;
  if (newRole === 'student') {
    if (!state.groups.length) {
      alert('Сначала создайте хотя бы одну группу');
      selectEl.value = previousRole;
      return;
    }
    const list = state.groups.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
    const answer = prompt(`В какую группу зачислить?\n${list}\n\nВведите номер группы:`);
    const idx = Number(answer) - 1;
    if (!state.groups[idx]) {
      alert('Группа не выбрана — роль не изменена');
      selectEl.value = previousRole;
      return;
    }
    groupId = state.groups[idx].id;
  }
  try {
    await api('POST', `/admin/users/${userId}/role`, { role: newRole, groupId });
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
    selectEl.value = previousRole;
  }
}

async function loadAdminStats() {
  const stats = await api('GET', '/admin/stats');
  const grid = document.getElementById('admin-stats-grid');
  grid.innerHTML = `
    <div class="stat-card"><div class="num accent">${stats.onlineTotal}</div><div class="lbl">Сейчас онлайн</div></div>
    <div class="stat-card"><div class="num">${stats.visitsToday}</div><div class="lbl">Посещений сегодня</div></div>
    <div class="stat-card"><div class="num">${stats.totalStudents}</div><div class="lbl">Студентов</div></div>
    <div class="stat-card"><div class="num">${stats.totalTeachers}</div><div class="lbl">Преподавателей</div></div>
    <div class="stat-card"><div class="num">${stats.totalAdmins}</div><div class="lbl">Админов</div></div>
    <div class="stat-card"><div class="num">${stats.totalGroups}</div><div class="lbl">Групп</div></div>
    <div class="stat-card"><div class="num">${stats.totalAssignments}</div><div class="lbl">Заданий создано</div></div>
    <div class="stat-card"><div class="num">${stats.totalPosts}</div><div class="lbl">Постов в ленте</div></div>
    <div class="stat-card"><div class="num">${stats.totalOrders}</div><div class="lbl">Заказов в магазине</div></div>
    <div class="stat-card"><div class="num">${stats.totalArCompletions}</div><div class="lbl">AR-точек найдено</div></div>
  `;

  const chartEl = document.getElementById('admin-visits-chart');
  const max = Math.max(1, ...stats.visitsLast7Days.map(d => d.count));
  chartEl.innerHTML = stats.visitsLast7Days.map(d => {
    const label = new Date(d.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    const heightPct = Math.max(Math.round((d.count / max) * 100), 4);
    return `
      <div class="visits-bar-col">
        <div class="visits-bar-count">${d.count}</div>
        <div class="visits-bar" style="height:${heightPct}%;"></div>
        <div class="visits-bar-label">${label}</div>
      </div>
    `;
  }).join('');
}

// ===================== БЭКАПЫ =====================

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

async function downloadFileAuthenticated(url, filename) {
  try {
    const res = await fetch(API + url, { headers: authHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Не удалось скачать файл');
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    alert(err.message);
  }
}

async function loadBackupsView() {
  const settings = await api('GET', '/admin/backup/settings');
  document.getElementById('backup-interval-input').value = settings.intervalDays;
  const info = document.getElementById('backup-schedule-info');
  if (settings.lastBackupAt) {
    info.textContent = `Последняя копия: ${formatDate(settings.lastBackupAt)}. Следующая автоматическая: ${formatDate(settings.nextBackupAt)}.`;
  } else {
    info.textContent = 'Автоматических копий ещё не было — первая будет создана в течение ближайшего часа.';
  }
  await loadBackupsList();
}

async function loadBackupsList() {
  const { backups } = await api('GET', '/admin/backup/list');
  const el = document.getElementById('backups-list-table');
  if (!backups.length) {
    el.innerHTML = `<div class="muted">Резервных копий пока нет.</div>`;
    return;
  }
  el.innerHTML = `
    <table class="users-table">
      <thead><tr><th>Файл</th><th>Размер</th><th>Создан</th><th></th></tr></thead>
      <tbody>
        ${backups.map(b => `
          <tr>
            <td style="font-size:12px;">${escapeHtml(b.filename)}</td>
            <td>${formatBytes(b.sizeBytes)}</td>
            <td>${formatDate(b.createdAt)}</td>
            <td style="display:flex; gap:6px;">
              <button class="del-btn" data-download="${b.filename}" style="color:var(--teal); border-color:var(--teal-soft);">Скачать</button>
              <button class="del-btn" data-delete-backup="${b.filename}">Удалить</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  el.querySelectorAll('[data-download]').forEach(btn => {
    btn.onclick = () => downloadFileAuthenticated(`/admin/backup/download/${encodeURIComponent(btn.dataset.download)}`, btn.dataset.download);
  });
  el.querySelectorAll('[data-delete-backup]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить эту резервную копию?')) return;
      await api('DELETE', `/admin/backup/${encodeURIComponent(btn.dataset.deleteBackup)}`);
      loadBackupsList();
    };
  });
}

document.getElementById('backup-interval-save').onclick = async () => {
  const intervalDays = document.getElementById('backup-interval-input').value;
  try {
    await api('POST', '/admin/backup/settings', { intervalDays });
    alert('Интервал сохранён');
    loadBackupsView();
  } catch (err) {
    alert(err.message);
  }
};

document.getElementById('backup-create-now').onclick = async () => {
  try {
    await api('POST', '/admin/backup/create');
    alert('Резервная копия создана');
    loadBackupsView();
  } catch (err) {
    alert(err.message);
  }
};

document.getElementById('backup-download-current').onclick = () => {
  downloadFileAuthenticated('/admin/backup/download-current', `college-backup-${new Date().toISOString().slice(0, 10)}.json`);
};

let pendingRestoreText = null;

document.getElementById('backup-restore-input').addEventListener('change', () => {
  const input = document.getElementById('backup-restore-input');
  const file = input.files[0];
  document.getElementById('backup-restore-error').textContent = '';
  pendingRestoreText = null;
  document.getElementById('backup-restore-btn').disabled = true;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingRestoreText = reader.result;
    document.getElementById('backup-restore-filename').textContent = `Выбран файл: ${file.name}`;
    document.getElementById('backup-restore-btn').disabled = false;
  };
  reader.readAsText(file);
});

document.getElementById('backup-restore-btn').onclick = async () => {
  const errEl = document.getElementById('backup-restore-error');
  errEl.textContent = '';
  if (!pendingRestoreText) return;
  if (!confirm('Это заменит ВСЕ текущие данные содержимым файла. Продолжить?')) return;
  try {
    const { usersRestored } = await api('POST', '/admin/backup/restore', { backupData: pendingRestoreText });
    alert(`Восстановлено. Пользователей в базе: ${usersRestored}. Рекомендуем всем заново войти в систему.`);
    document.getElementById('backup-restore-input').value = '';
    document.getElementById('backup-restore-filename').textContent = '';
    document.getElementById('backup-restore-btn').disabled = true;
    pendingRestoreText = null;
    loadBackupsView();
  } catch (err) {
    errEl.textContent = err.message;
  }
};

async function loadAdminReports() {
  const { reports } = await api('GET', '/admin/reports');
  const el = document.getElementById('admin-reports-table');
  const openCount = reports.filter(r => r.status === 'open').length;
  setShortcutCount('admin-reports-count', openCount);
  const adminBadge = document.getElementById('nav-admin-count');
  if (adminBadge) setShortcutCount('nav-admin-count', openCount);

  if (!reports.length) {
    el.innerHTML = `<div class="muted">Жалоб пока нет.</div>`;
    return;
  }
  const contextLabel = (ctx) => {
    if (!ctx) return '—';
    return { post: 'Пост', profile: 'Профиль', chat: 'Чат' }[ctx.type] || ctx.type;
  };
  el.innerHTML = `
    <table class="users-table">
      <thead><tr><th>От кого</th><th>На кого</th><th>Причина</th><th>Контекст</th><th>Когда</th><th>Статус</th><th></th></tr></thead>
      <tbody>
        ${reports.map(r => `
          <tr>
            <td>${escapeHtml(r.reporterName)}</td>
            <td>${escapeHtml(r.reportedName)}</td>
            <td style="max-width:220px; white-space:normal;">${escapeHtml(r.reason)}</td>
            <td>${contextLabel(r.context)}</td>
            <td>${formatDate(r.createdAt)}</td>
            <td><span class="role-tag ${r.status === 'open' ? 'admin' : 'student'}">${r.status === 'open' ? 'Открыта' : 'Решена'}</span></td>
            <td style="display:flex; gap:6px;">
              ${r.status === 'open' ? `<button class="del-btn" data-resolve="${r.id}" style="color:var(--teal); border-color:var(--teal-soft);">Решено</button>` : ''}
              <button class="del-btn" data-delete-report="${r.id}">Удалить</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  el.querySelectorAll('[data-resolve]').forEach(btn => {
    btn.onclick = async () => {
      await api('POST', `/admin/reports/${btn.dataset.resolve}/resolve`);
      loadAdminReports();
    };
  });
  el.querySelectorAll('[data-delete-report]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить жалобу?')) return;
      await api('DELETE', `/admin/reports/${btn.dataset.deleteReport}`);
      loadAdminReports();
    };
  });
}

// ===================== ЛЕНТА НОВОСТЕЙ И ПОСТЫ =====================

function formatDate(ts) {
  return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function postCardHtml(p) {
  const canDelete = p.authorId === state.user.id || state.user.role === 'admin';
  let mediaHtml = '';
  if (p.mediaUrl) {
    mediaHtml = p.mediaType === 'video'
      ? `<div class="post-media"><video src="${p.mediaUrl}" controls></video></div>`
      : `<div class="post-media"><img src="${p.mediaUrl}" alt=""></div>`;
  }
  return `
    <div class="post-card" data-id="${p.id}">
      <div class="post-card-header">
        ${avatarHtml('post-avatar', p.authorName, p.authorAvatarUrl, p.authorAvatarColor)}
        <div>
          <div class="post-author-name" data-author-id="${p.authorId}">${escapeHtml(p.authorName)}</div>
          <div class="post-meta">${roleLabel(p.authorRole)} · ${formatDate(p.createdAt)}</div>
        </div>
      </div>
      ${p.text ? `<div class="post-text">${escapeHtml(p.text)}</div>` : ''}
      ${mediaHtml}
      <div class="post-footer">
        <button class="post-like-btn ${p.likedByMe ? 'liked' : ''}" data-like-id="${p.id}">❤ ${p.likesCount}</button>
        ${!canDelete ? `<button class="post-report-btn" data-report-author="${p.authorId}" data-report-name="${escapeHtml(p.authorName)}" data-report-post="${p.id}">🚩</button>` : ''}
        ${canDelete ? `<button class="post-delete-btn" data-delete-id="${p.id}">Удалить</button>` : ''}
      </div>
    </div>
  `;
}

function wirePostCards(container, reloadFn) {
  container.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.onclick = async () => {
      await api('POST', `/posts/${btn.dataset.likeId}/like`);
      reloadFn();
    };
  });
  container.querySelectorAll('.post-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить пост?')) return;
      await api('DELETE', `/posts/${btn.dataset.deleteId}`);
      reloadFn();
    };
  });
  container.querySelectorAll('.post-report-btn').forEach(btn => {
    btn.onclick = () => openReportModal(Number(btn.dataset.reportAuthor), btn.dataset.reportName, 'post', btn.dataset.reportPost);
  });
  container.querySelectorAll('.post-author-name').forEach(el => {
    el.onclick = () => openUserProfile(Number(el.dataset.authorId));
  });
}

async function loadFeed() {
  const { posts } = await api('GET', '/posts/feed');
  const listEl = document.getElementById('feed-list');
  if (!posts.length) {
    listEl.innerHTML = `<div class="muted">Пока нет новостей. Загляните позже.</div>`;
  } else {
    listEl.innerHTML = posts.map(postCardHtml).join('');
  }
  wirePostCards(listEl, loadFeed);
}

function renderPostsGrid(container, posts, reloadFn) {
  if (!posts.length) {
    container.innerHTML = `<div class="muted">Пока нет публикаций.</div>`;
    return;
  }
  container.innerHTML = posts.map(p => {
    const canDelete = p.authorId === state.user.id || state.user.role === 'admin';
    let inner;
    if (p.mediaType === 'video') inner = `<video src="${p.mediaUrl}" muted></video>`;
    else if (p.mediaType === 'image') inner = `<img src="${p.mediaUrl}" alt="">`;
    else inner = `<div class="grid-post-text">${escapeHtml(p.text || '')}</div>`;
    return `
      <div class="grid-post-thumb" data-id="${p.id}" title="${escapeHtml(p.text || '')}">
        ${inner}
        ${canDelete ? `<button class="grid-post-delete" data-delete-id="${p.id}">✕</button>` : ''}
      </div>
    `;
  }).join('');
  container.querySelectorAll('.grid-post-delete').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Удалить пост?')) return;
      await api('DELETE', `/posts/${btn.dataset.deleteId}`);
      reloadFn();
    };
  });
}

async function loadOwnProfilePosts() {
  const { posts } = await api('GET', `/users/${state.user.id}/posts`);
  renderPostsGrid(document.getElementById('profile-posts-grid'), posts, loadOwnProfilePosts);
  const statPosts = document.getElementById('profile-stat-posts');
  if (statPosts) statPosts.textContent = posts.length;
  setShortcutCount('shortcut-count-feed', posts.length);
}

// ===================== МАГАЗИН =====================

function updateCoinBalanceDisplay() {
  const el = document.getElementById('shop-coin-amount');
  if (el) el.textContent = state.user.coins || 0;
}

async function loadShop() {
  updateCoinBalanceDisplay();
  const { products } = await api('GET', '/products');
  const grid = document.getElementById('shop-grid');
  if (!products.length) {
    grid.innerHTML = `<div class="muted">Пока нет товаров. Загляните позже.</div>`;
    return;
  }
  grid.innerHTML = products.map(p => productCardHtml(p, false)).join('');
  grid.querySelectorAll('.product-buy-btn').forEach(btn => {
    btn.onclick = async () => {
      const p = products.find(x => x.id === Number(btn.dataset.id));
      if (!confirm(`Купить «${p.name}» за ${p.priceCoins} 🪙?`)) return;
      try {
        const { user } = await api('POST', '/shop/buy', { productId: p.id });
        state.user = user;
        updateCoinBalanceDisplay();
        renderProfile();
        alert('Покупка оформлена! Заказ передан администрации колледжа.');
        loadShop();
      } catch (err) {
        alert(err.message);
      }
    };
  });
}

function productCardHtml(p, adminMode) {
  const photo = p.imageUrl ? `<img src="${p.imageUrl}" alt="">` : '🛍';
  const canAfford = !adminMode && (state.user.coins || 0) >= p.priceCoins;
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-photo">${photo}</div>
      <div class="product-body">
        <div class="product-name">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="product-desc">${escapeHtml(p.description)}</div>` : ''}
        <div class="product-footer">
          <div class="product-price">🪙 ${p.priceCoins}</div>
          ${adminMode
            ? `<button class="product-delete-btn" data-delete-product="${p.id}">Удалить</button>`
            : `<button class="product-buy-btn" data-id="${p.id}" ${canAfford ? '' : 'disabled'}>${canAfford ? 'Купить' : 'Не хватает'}</button>`}
        </div>
      </div>
    </div>
  `;
}

// ---------- Админ: товары ----------

let pendingProductPhotoDataUrl = null;

document.getElementById('product-photo-input').addEventListener('change', () => {
  const input = document.getElementById('product-photo-input');
  const file = input.files[0];
  if (!file) return;
  const MAX_CLIENT_BYTES = 8 * 1024 * 1024;
  if (file.size > MAX_CLIENT_BYTES) { alert('Файл слишком большой (максимум ~8 МБ)'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    pendingProductPhotoDataUrl = reader.result;
    document.getElementById('product-photo-preview').innerHTML = `<img src="${pendingProductPhotoDataUrl}" alt="">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('form-new-product').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('product-error');
  errEl.textContent = '';
  const name = document.getElementById('product-name').value.trim();
  const description = document.getElementById('product-desc').value.trim();
  const priceCoins = document.getElementById('product-price').value;
  try {
    await api('POST', '/admin/products', { name, description, priceCoins, mediaData: pendingProductPhotoDataUrl });
    e.target.reset();
    pendingProductPhotoDataUrl = null;
    document.getElementById('product-photo-preview').innerHTML = `<span class="muted">Фото не выбрано</span>`;
    loadAdminProducts();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

async function loadAdminProducts() {
  const { products } = await api('GET', '/products');
  const grid = document.getElementById('admin-products-grid');
  if (!products.length) {
    grid.innerHTML = `<div class="muted">Пока нет товаров.</div>`;
    return;
  }
  grid.innerHTML = products.map(p => productCardHtml(p, true)).join('');
  grid.querySelectorAll('[data-delete-product]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить товар?')) return;
      await api('DELETE', `/admin/products/${btn.dataset.deleteProduct}`);
      loadAdminProducts();
    };
  });
}

// ---------- Админ: заказы ----------

async function loadAdminPurchases() {
  const { purchases } = await api('GET', '/admin/purchases');
  const el = document.getElementById('admin-purchases-table');
  if (!purchases.length) {
    el.innerHTML = `<div class="muted">Заказов пока нет.</div>`;
    return;
  }
  el.innerHTML = `
    <table class="users-table">
      <thead><tr><th>Студент</th><th>Товар</th><th>Цена</th><th>Когда</th><th>Статус</th><th></th></tr></thead>
      <tbody>
        ${purchases.map(p => `
          <tr>
            <td>${escapeHtml(p.userName)}</td>
            <td>${escapeHtml(p.productName)}</td>
            <td>🪙 ${p.priceCoins}</td>
            <td>${formatDate(p.createdAt)}</td>
            <td><span class="purchase-status ${p.status}">${p.status === 'fulfilled' ? 'Выдано' : 'Заказано'}</span></td>
            <td style="display:flex; gap:6px;">
              ${p.status !== 'fulfilled' ? `<button class="del-btn" data-fulfill="${p.id}" style="color:var(--teal); border-color:var(--teal-soft);">Выдано</button>` : ''}
              <button class="del-btn" data-cancel-purchase="${p.id}">Отменить</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  el.querySelectorAll('[data-fulfill]').forEach(btn => {
    btn.onclick = async () => {
      await api('POST', `/admin/purchases/${btn.dataset.fulfill}/fulfill`);
      loadAdminPurchases();
    };
  });
  el.querySelectorAll('[data-cancel-purchase]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Отменить заказ и вернуть монетки студенту?')) return;
      await api('DELETE', `/admin/purchases/${btn.dataset.cancelPurchase}`);
      loadAdminPurchases();
    };
  });
}

async function openUserProfile(userId) {
  if (userId === state.user.id) {
    document.querySelector('.nav-btn[data-view="profile"]').click();
    return;
  }
  const { user, posts } = await api('GET', `/users/${userId}/posts`);
  const modal = document.getElementById('modal-user-profile');
  const content = document.getElementById('user-profile-content');
  const group = state.groups.find(g => g.id === user.groupId);
  content.innerHTML = `
    <div class="user-profile-header">
      ${avatarHtml('avatar', user.fullName, user.avatarUrl, user.avatarColor)}
      <div style="flex:1;">
        <h2 style="margin:0 0 4px;">${escapeHtml(user.fullName)}</h2>
        <div class="muted">${roleLabel(user.role)}${group ? ' · ' + escapeHtml(group.name) : ''}</div>
        <div style="margin-top:4px;">${user.online ? '<span class="online-label">В сети</span>' : '<span class="offline-label">Не в сети</span>'}</div>
      </div>
      <button class="report-btn" id="report-user-btn" title="Пожаловаться">🚩 Пожаловаться</button>
    </div>
    ${user.bio ? `<p class="muted" style="margin:0 0 16px;">${escapeHtml(user.bio)}</p>` : ''}
    <div class="profile-stats" style="margin-bottom:20px;">
      <div class="profile-stat"><div class="num">${user.level}</div><div class="lbl">Уровень</div></div>
      <div class="profile-stat"><div class="num">${user.xp}</div><div class="lbl">Всего XP</div></div>
      <div class="profile-stat"><div class="num">${posts.length}</div><div class="lbl">Публикаций</div></div>
    </div>
    <h3>Публикации</h3>
    <div id="user-profile-posts" class="posts-grid"></div>
  `;
  modal.classList.remove('hidden');
  renderPostsGrid(document.getElementById('user-profile-posts'), posts, () => openUserProfile(userId));
  document.getElementById('report-user-btn').onclick = () => openReportModal(userId, user.fullName, 'profile', null);
}

document.getElementById('user-profile-close').onclick = () => {
  document.getElementById('modal-user-profile').classList.add('hidden');
};

// Универсальная настройка формы-«композера» для публикации поста (используется и в ленте, и в профиле)
function setupComposer({ formId, textId, fileId, filenameId, previewId, errorId, toFeedCheckboxId, defaultTarget, onSuccess }) {
  const form = document.getElementById(formId);
  const fileInput = document.getElementById(fileId);
  const previewEl = document.getElementById(previewId);
  const filenameEl = document.getElementById(filenameId);
  let pendingDataUrl = null;

  function clearAttachment() {
    pendingDataUrl = null;
    fileInput.value = '';
    filenameEl.textContent = '';
    previewEl.classList.add('hidden');
    previewEl.innerHTML = '';
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const MAX_CLIENT_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_CLIENT_BYTES) {
      alert('Файл слишком большой (максимум ~15 МБ для прототипа)');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingDataUrl = reader.result;
      filenameEl.textContent = file.name;
      previewEl.classList.remove('hidden');
      const mediaTag = file.type.startsWith('video')
        ? `<video src="${pendingDataUrl}" controls></video>`
        : `<img src="${pendingDataUrl}">`;
      previewEl.innerHTML = mediaTag + `<button type="button" class="remove-preview">✕</button>`;
      previewEl.querySelector('.remove-preview').onclick = clearAttachment;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById(errorId);
    errEl.textContent = '';
    const textEl = document.getElementById(textId);
    const text = textEl.value.trim();
    if (!text && !pendingDataUrl) {
      errEl.textContent = 'Добавьте текст, фото или видео';
      return;
    }
    let target = defaultTarget || 'profile';
    if (toFeedCheckboxId) {
      target = document.getElementById(toFeedCheckboxId).checked ? 'feed' : 'profile';
    }
    try {
      await api('POST', '/posts', { text, target, mediaData: pendingDataUrl });
      textEl.value = '';
      clearAttachment();
      if (toFeedCheckboxId) document.getElementById(toFeedCheckboxId).checked = false;
      onSuccess();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

setupComposer({
  formId: 'feed-composer', textId: 'feed-composer-text', fileId: 'feed-composer-file',
  filenameId: 'feed-composer-filename', previewId: 'feed-composer-preview', errorId: 'feed-composer-error',
  defaultTarget: 'feed',
  onSuccess: loadFeed
});

setupComposer({
  formId: 'profile-composer', textId: 'profile-composer-text', fileId: 'profile-composer-file',
  filenameId: 'profile-composer-filename', previewId: 'profile-composer-preview', errorId: 'profile-composer-error',
  toFeedCheckboxId: 'profile-composer-tofeed', defaultTarget: 'profile',
  onSuccess: () => { loadOwnProfilePosts(); loadFeed(); }
});

// ===================== СТАРТ =====================

tryAutoLogin();
