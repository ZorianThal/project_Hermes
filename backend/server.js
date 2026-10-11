const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { load, save, nextId, DB_PATH } = require('./db');

const JWT_SECRET = 'college-ecosystem-dev-secret-change-me';
const app = express();
app.use(cors());
// Лимит увеличен, т.к. фото/видео для ленты новостей приходят как base64 в теле запроса
app.use(express.json({ limit: '30mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Хранилище медиа для постов и историй (фото/видео ленты, профиля, сторис, товаров, чатов, заданий) ----------
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads', 'posts');
const STORIES_DIR = path.join(__dirname, 'public', 'uploads', 'stories');
const AVATARS_DIR = path.join(__dirname, 'public', 'uploads', 'avatars');
const PRODUCTS_DIR = path.join(__dirname, 'public', 'uploads', 'products');
const CHAT_MEDIA_DIR = path.join(__dirname, 'public', 'uploads', 'chat');
const ASSIGNMENTS_DIR = path.join(__dirname, 'public', 'uploads', 'assignments');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(STORIES_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
fs.mkdirSync(CHAT_MEDIA_DIR, { recursive: true });
fs.mkdirSync(ASSIGNMENTS_DIR, { recursive: true });

// Резервные копии храним ВНЕ /public, чтобы их нельзя было скачать напрямую по URL — только через админ-эндпоинты
const BACKUPS_DIR = path.join(__dirname, 'backups');
fs.mkdirSync(BACKUPS_DIR, { recursive: true });

const AVATAR_COLORS = ['orange', 'blue', 'purple', 'green', 'pink', 'teal'];

const ALLOWED_MEDIA_MIME = {
  'image/jpeg': { ext: 'jpg', kind: 'image' },
  'image/png': { ext: 'png', kind: 'image' },
  'image/gif': { ext: 'gif', kind: 'image' },
  'image/webp': { ext: 'webp', kind: 'image' },
  'video/mp4': { ext: 'mp4', kind: 'video' },
  'video/webm': { ext: 'webm', kind: 'video' },
  'video/quicktime': { ext: 'mov', kind: 'video' }
};

// Принимает data URL (data:image/png;base64,....), сохраняет файл на диск и возвращает {url, kind}
function saveMediaFromDataUrl(dataUrl, targetDir = UPLOADS_DIR, urlPrefix = '/uploads/posts/') {
  const match = /^data:([\w/.+-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  const mime = match[1];
  const meta = ALLOWED_MEDIA_MIME[mime];
  if (!meta) return null;
  const buffer = Buffer.from(match[2], 'base64');
  const MAX_BYTES = 20 * 1024 * 1024; // 20 МБ, с запасом под base64-накладные расходы в JSON
  if (buffer.length > MAX_BYTES) return null;
  const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${meta.ext}`;
  fs.writeFileSync(path.join(targetDir, filename), buffer);
  return { url: `${urlPrefix}${filename}`, kind: meta.kind };
}

function deleteMediaFile(url) {
  const allowedPrefixes = ['/uploads/posts/', '/uploads/stories/', '/uploads/avatars/', '/uploads/products/', '/uploads/chat/', '/uploads/assignments/'];
  if (!url || !allowedPrefixes.some(p => url.startsWith(p))) return;
  const filePath = path.join(__dirname, 'public', url);
  fs.unlink(filePath, () => {});
}

// ---------- Инициализация: сид админа и базовых групп/чатов ----------
function seedIfEmpty() {
  const db = load();
  if (db.users.length === 0) {
    const adminId = nextId(db.users);
    db.users.push({
      id: adminId,
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 8),
      role: 'admin',
      fullName: 'Администратор',
      groupId: null,
      xp: 0,
      level: 1,
      bio: '',
      createdAt: Date.now()
    });

    const groupId = nextId(db.groups);
    db.groups.push({ id: groupId, name: 'ИС-21' });

    const generalChatId = nextId(db.chats);
    db.chats.push({ id: generalChatId, name: 'Общий чат колледжа', groupId: null, type: 'general', members: null, reads: {} });

    const groupChatId = nextId(db.chats);
    db.chats.push({ id: groupChatId, name: `Чат группы ${db.groups[0].name}`, groupId, type: 'class', members: null, reads: {} });

    save(db);
    console.log('Создан администратор по умолчанию -> логин: admin / пароль: admin123');
  }
}
seedIfEmpty();

// ---------- Вспомогательные функции ----------
function xpForLevel(level) {
  // Сколько всего опыта нужно, чтобы достичь начала данного уровня
  return (level - 1) * 100;
}
function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

// Расстояние между двумя точками на Земле в метрах (для проверки, что студент действительно рядом с AR-точкой)
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

const ONLINE_THRESHOLD_MS = 60 * 1000;

function auth(requiredRoles = null) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    const token = (header && header.startsWith('Bearer ')) ? header.slice(7) : req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'Нет токена авторизации' });
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const db = load();
      const user = db.users.find(u => u.id === payload.id);
      if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Недостаточно прав' });
      }

      // Отметка "онлайн" и посещения за сегодня — обновляем не чаще раза в 20 секунд,
      // чтобы не писать на диск на каждый запрос
      if (!user.lastActiveAt || Date.now() - user.lastActiveAt > 20000) {
        user.lastActiveAt = Date.now();
        const today = todayStr();
        if (!db.visits.some(v => v.userId === user.id && v.date === today)) {
          db.visits.push({ id: nextId(db.visits), userId: user.id, date: today, createdAt: Date.now() });
        }
        save(db);
      }

      req.user = user;
      req.db = db;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Невалидный токен' });
    }
  };
}

function getMondayStr(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getIsoDayOfWeek(d = new Date()) {
  const day = d.getDay();
  return day === 0 ? 7 : day; // 1 = Mon, 2 = Tue, ..., 7 = Sun
}

const DAILY_REWARDS_CONFIG = [
  { day: 1, label: 'ПН // ДЕНЬ 1', xp: 100, coins: 10, bonusText: 'Старт недели: +100 XP / +10 ⟠' },
  { day: 2, label: 'ВТ // ДЕНЬ 2', xp: 200, coins: 20, bonusText: 'Ускорение: +200 XP / +20 ⟠' },
  { day: 3, label: 'СР // ДЕНЬ 3', xp: 300, coins: 30, bonusText: 'Экватор недели: +300 XP / +30 ⟠' },
  { day: 4, label: 'ЧТ // ДЕНЬ 4', xp: 400, coins: 40, bonusText: 'Гипер-драйв: +400 XP / +40 ⟠' },
  { day: 5, label: 'ПТ // ДЕНЬ 5', xp: 500, coins: 50, bonusText: 'Финал учебы: +500 XP / +50 ⟠' },
  { day: 6, label: 'СБ // ДЕНЬ 6', xp: 600, coins: 60, bonusText: 'Бонус выходного: +600 XP / +60 ⟠' },
  { day: 7, label: 'ВС // ДЕНЬ 7', xp: 700, coins: 70, bonusText: 'МЕГА-ДЖЕКПОТ: +700 XP / +70 ⟠ + Квантовое лакомство!' }
];

function ensureUserDailyState(user) {
  const currentMonday = getMondayStr();
  if (!user.dailyStreak) {
    user.dailyStreak = { weekStart: currentMonday, claimedDays: [], lastClaimDate: null, isBroken: false };
  } else if (user.dailyStreak.weekStart !== currentMonday) {
    // Новая неделя -> полный сброс!
    user.dailyStreak = { weekStart: currentMonday, claimedDays: [], lastClaimDate: null, isBroken: false };
  }

  const todayIsoDay = getIsoDayOfWeek(); // 1..7
  const claimed = user.dailyStreak.claimedDays || [];

  // Проверяем, не нарушена ли серия:
  // Если сегодня день D > 1 и какой-то из предыдущих дней 1..(D-1) не был забран:
  // то цепочка на текущей неделе разрывается до следующего понедельника!
  if (!user.dailyStreak.isBroken) {
    for (let d = 1; d < todayIsoDay; d++) {
      if (!claimed.includes(d)) {
        user.dailyStreak.isBroken = true;
        break;
      }
    }
  }

  return user.dailyStreak;
}

function ensureUserPet(user) {
  if (!user.pet) {
    user.pet = {
      name: 'КИБЕР-СПУТНИК',
      petType: null, // null означает, что требуется выбрать питомца
      hunger: 100,
      happiness: 100,
      energy: 90,
      level: 1,
      xp: 0,
      lastFedAt: Date.now(),
      equipped: {
        head: null,
        body: null,
        limbs: null,
        color: '#FF4D1C'
      },
      inventory: []
    };
  }
  user.pet.equipped = user.pet.equipped || {};
  if (!user.pet.equipped.head && user.pet.equipped.hat) user.pet.equipped.head = user.pet.equipped.hat;
  if (!user.pet.equipped.body && user.pet.equipped.outfit) user.pet.equipped.body = user.pet.equipped.outfit;
  if (!user.pet.equipped.limbs && user.pet.equipped.boots) user.pet.equipped.limbs = user.pet.equipped.boots;
  if (!user.pet.equipped.color) user.pet.equipped.color = '#FF4D1C';
  user.pet.inventory = user.pet.inventory || [];

  // Постепенное снижение сытости со временем
  if (user.pet.lastFedAt) {
    const hoursSinceFed = (Date.now() - user.pet.lastFedAt) / (1000 * 60 * 60);
    if (hoursSinceFed > 1) {
      const drop = Math.floor(hoursSinceFed * 3);
      user.pet.hunger = Math.max(10, (user.pet.hunger || 80) - drop);
      if (user.pet.hunger < 30) {
        user.pet.happiness = Math.max(20, (user.pet.happiness || 85) - Math.floor(drop / 2));
      }
    }
  }
  return user.pet;
}

function publicUser(u) {
  return {
    id: u.id, username: u.username, role: u.role, fullName: u.fullName,
    groupId: u.groupId, xp: u.xp, level: u.level, coins: u.coins || 0, bio: u.bio || '', createdAt: u.createdAt,
    avatarUrl: u.avatarUrl || null, avatarColor: u.avatarColor || 'orange',
    unlockedColors: u.unlockedColors || ['#FF4D1C'],
    dailyStreak: u.dailyStreak || { weekStart: null, claimedDays: [], lastClaimDate: null, isBroken: false },
    pet: u.pet || null,
    online: !!(u.lastActiveAt && Date.now() - u.lastActiveAt < ONLINE_THRESHOLD_MS)
  };
}

// ================= AUTH =================

// Самостоятельная регистрация — только студенты
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, groupId } = req.body;
  if (!username || !password || !fullName || !groupId) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  const db = load();
  if (db.users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Такой логин уже занят' });
  }
  if (!db.groups.some(g => g.id === Number(groupId))) {
    return res.status(400).json({ error: 'Группа не найдена' });
  }
  const id = nextId(db.users);
  const user = {
    id, username, passwordHash: bcrypt.hashSync(password, 8),
    role: 'student', fullName, groupId: Number(groupId), xp: 0, level: 1, coins: 0,
    bio: '', createdAt: Date.now()
  };
  db.users.push(user);
  save(db);
  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = load();
  const user = db.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ error: 'Неверный логин или пароль' });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: publicUser(user) });
});

app.get('/api/me', auth(), (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Обновление своей краткой информации (био)
app.patch('/api/users/me', auth(), (req, res) => {
  const { bio } = req.body;
  const db = load();
  const me = db.users.find(u => u.id === req.user.id);
  me.bio = (bio || '').trim().slice(0, 300);
  save(db);
  res.json({ user: publicUser(me) });
});

// Установить аватар: либо загрузить своё фото (mediaData / avatar), либо выбрать один из готовых цветов (color)
app.post('/api/users/me/avatar', auth(), (req, res) => {
  const mediaData = req.body.mediaData || req.body.avatar;
  const color = req.body.color || req.body.avatarColor;
  const db = load();
  const me = db.users.find(u => u.id === req.user.id);

  if (mediaData) {
    const media = saveMediaFromDataUrl(mediaData, AVATARS_DIR, '/uploads/avatars/');
    if (!media || media.kind !== 'image') {
      return res.status(400).json({ error: 'Для аватара нужно фото (jpg/png/gif/webp) до 20 МБ' });
    }
    if (me.avatarUrl) deleteMediaFile(me.avatarUrl);
    me.avatarUrl = media.url;
  } else if (color) {
    if (me.avatarUrl) { deleteMediaFile(me.avatarUrl); me.avatarUrl = null; }
    me.avatarColor = color;
  } else {
    return res.status(400).json({ error: 'Передайте фото или выберите цвет' });
  }
  save(db);
  res.json({ user: publicUser(me), avatarUrl: me.avatarUrl });
});

// Сбросить аватар к значку по умолчанию (первая буква имени на цветном фоне)
app.delete('/api/users/me/avatar', auth(), (req, res) => {
  const db = load();
  const me = db.users.find(u => u.id === req.user.id);
  if (me.avatarUrl) deleteMediaFile(me.avatarUrl);
  me.avatarUrl = null;
  me.avatarColor = 'orange';
  save(db);
  res.json({ user: publicUser(me) });
});

// Поиск пользователей — для того, чтобы начать личный чат, добавить участника в группу,
// или выбрать конкретных студентов при назначении задания (?role=student)
app.get('/api/users/search', auth(), (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const roleFilter = req.query.role;
  if (q.length < 1) return res.json({ users: [] });
  const db = load();
  const results = db.users
    .filter(u => u.id !== req.user.id)
    .filter(u => !roleFilter || u.role === roleFilter)
    .filter(u => (u.fullName && u.fullName.toLowerCase().includes(q)) || (u.username && u.username.toLowerCase().includes(q)))
    .slice(0, 30)
    .map(publicUser);
  res.json({ users: results });
});

app.get('/api/groups', (req, res) => {
  const db = load();
  res.json({ groups: db.groups });
});

// ================= ЧАТЫ =================

// Видимость чата пользователю: у новых чатов (личные/группы) есть явный список участников members;
// у старых системных чатов (общий чат колледжа / чат учебной группы) members === null,
// и видимость считается по типу/groupId — как было в прототипе раньше.
function chatVisibleToUser(chat, user) {
  if (Array.isArray(chat.members)) {
    return chat.members.includes(user.id);
  }
  if (chat.groupId === null) return true; // общий чат колледжа виден всем
  return user.role !== 'student' || chat.groupId === user.groupId;
}

function chatDisplayInfo(chat, db, currentUserId) {
  let name = chat.name;
  let avatarLabel = (chat.name || '?').slice(0, 1).toUpperCase();
  let otherUser = null;
  if (chat.type === 'direct') {
    const otherId = (chat.members || []).find(id => id !== currentUserId);
    const other = db.users.find(u => u.id === otherId);
    if (other) {
      name = other.fullName;
      avatarLabel = other.fullName.slice(0, 1).toUpperCase();
      otherUser = publicUser(other);
    }
  }
  const chatMessages = db.messages.filter(m => m.chatId === chat.id);
  const lastMsg = chatMessages[chatMessages.length - 1];
  const lastReadAt = (chat.reads && chat.reads[currentUserId]) || 0;
  const unreadCount = chatMessages.filter(m => m.userId !== currentUserId && m.createdAt > lastReadAt).length;
  let lastMessageText = '';
  if (lastMsg) {
    if (lastMsg.text) lastMessageText = lastMsg.text;
    else if (lastMsg.mediaType === 'video') lastMessageText = '🎥 Видео';
    else if (lastMsg.mediaType === 'image') lastMessageText = '📷 Фото';
  }
  return {
    id: chat.id,
    name,
    avatarLabel,
    type: chat.type,
    otherUser,
    pinned: !!(chat.pinnedBy || []).includes(currentUserId),
    lastMessageText,
    lastMessageAt: lastMsg ? lastMsg.createdAt : chat.id,
    unreadCount
  };
}

// Скрыт ли чат для пользователя ("удалить чат" — на самом деле просто прячем из своего списка;
// если придёт новое сообщение после скрытия, чат снова появится — как в большинстве мессенджеров)
function chatHiddenForUser(chat, db, userId) {
  const hiddenAt = chat.hiddenBy && chat.hiddenBy[userId];
  if (!hiddenAt) return false;
  const chatMessages = db.messages.filter(m => m.chatId === chat.id);
  const lastMsg = chatMessages[chatMessages.length - 1];
  return !lastMsg || lastMsg.createdAt <= hiddenAt;
}

app.get('/api/chats', auth(), (req, res) => {
  const db = load();
  const visible = db.chats.filter(c => chatVisibleToUser(c, req.user) && !chatHiddenForUser(c, db, req.user.id));
  const list = visible
    .map(c => chatDisplayInfo(c, db, req.user.id))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.lastMessageAt - a.lastMessageAt;
    });
  res.json({ chats: list });
});

// Закрепить/открепить чат вверху списка (только для себя)
app.post('/api/chats/:id/pin', auth(), (req, res) => {
  const db = load();
  const chat = db.chats.find(c => c.id === Number(req.params.id));
  if (!chat) return res.status(404).json({ error: 'Чат не найден' });
  if (!chatVisibleToUser(chat, req.user)) return res.status(403).json({ error: 'Нет доступа к чату' });
  chat.pinnedBy = chat.pinnedBy || [];
  const idx = chat.pinnedBy.indexOf(req.user.id);
  if (idx === -1) chat.pinnedBy.push(req.user.id); else chat.pinnedBy.splice(idx, 1);
  save(db);
  res.json({ pinned: chat.pinnedBy.includes(req.user.id) });
});

// "Удалить" чат — скрыть из своего списка (у собеседника/остальных участников чат остаётся)
app.post('/api/chats/:id/hide', auth(), (req, res) => {
  const db = load();
  const chat = db.chats.find(c => c.id === Number(req.params.id));
  if (!chat) return res.status(404).json({ error: 'Чат не найден' });
  if (!chatVisibleToUser(chat, req.user)) return res.status(403).json({ error: 'Нет доступа к чату' });
  chat.hiddenBy = chat.hiddenBy || {};
  chat.hiddenBy[req.user.id] = Date.now();
  chat.pinnedBy = (chat.pinnedBy || []).filter(id => id !== req.user.id);
  save(db);
  res.json({ ok: true });
});

// Начать (или открыть уже существующий) личный чат с другим пользователем
app.post('/api/chats/direct', auth(), (req, res) => {
  const otherId = Number(req.body.userId || req.body.targetUserId);
  if (!otherId || otherId === req.user.id) {
    return res.status(400).json({ error: 'Некорректный пользователь' });
  }
  const db = load();
  const other = db.users.find(u => u.id === otherId);
  if (!other) return res.status(404).json({ error: 'Пользователь не найден' });

  let chat = db.chats.find(c =>
    c.type === 'direct' &&
    Array.isArray(c.members) &&
    c.members.length === 2 &&
    c.members.includes(req.user.id) &&
    c.members.includes(otherId)
  );
  if (!chat) {
    chat = {
      id: nextId(db.chats), name: null, groupId: null, type: 'direct',
      members: [req.user.id, otherId], reads: {}
    };
    db.chats.push(chat);
    save(db);
  }
  res.json({ chat: chatDisplayInfo(chat, db, req.user.id) });
});

// Создать групповой чат (аналог группы в Telegram) с произвольным списком участников
app.post('/api/chats/group', auth(), (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Укажите название группы' });
  const ids = Array.isArray(memberIds) ? memberIds.map(Number).filter(n => !Number.isNaN(n)) : [];
  const db = load();
  const members = Array.from(new Set([req.user.id, ...ids])).filter(id => db.users.some(u => u.id === id));
  if (members.length < 2) {
    return res.status(400).json({ error: 'Добавьте хотя бы одного участника' });
  }
  const chat = {
    id: nextId(db.chats), name: name.trim().slice(0, 60), groupId: null, type: 'group',
    members, reads: {}
  };
  db.chats.push(chat);
  save(db);
  res.json({ chat: chatDisplayInfo(chat, db, req.user.id) });
});

app.get('/api/chats/:id/messages', auth(), (req, res) => {
  const db = load();
  const chatId = Number(req.params.id);
  const chat = db.chats.find(c => c.id === chatId);
  if (!chat) return res.status(404).json({ error: 'Чат не найден' });
  if (!chatVisibleToUser(chat, req.user)) return res.status(403).json({ error: 'Нет доступа к чату' });

  const msgs = db.messages
    .filter(m => m.chatId === chatId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(m => {
      const author = db.users.find(u => u.id === m.userId);
      return {
        ...m,
        authorName: author ? author.fullName : '???',
        authorRole: author ? author.role : null,
        authorAvatarUrl: author ? author.avatarUrl : null,
        authorAvatarColor: author ? author.avatarColor : 'orange'
      };
    });

  chat.reads = chat.reads || {};
  chat.reads[req.user.id] = Date.now();
  save(db);

  res.json({ messages: msgs });
});

app.post('/api/chats/:id/messages', auth(), (req, res) => {
  const { text, mediaData } = req.body;
  const trimmedText = (text || '').trim().slice(0, 2000);

  let media = null;
  if (mediaData) {
    media = saveMediaFromDataUrl(mediaData, CHAT_MEDIA_DIR, '/uploads/chat/');
    if (!media) {
      return res.status(400).json({ error: 'Неподдерживаемый файл: разрешены фото (jpg/png/gif/webp) и видео (mp4/webm/mov) до 20 МБ' });
    }
  }
  if (!trimmedText && !media) return res.status(400).json({ error: 'Пустое сообщение' });

  const db = load();
  const chatId = Number(req.params.id);
  const chat = db.chats.find(c => c.id === chatId);
  if (!chat) return res.status(404).json({ error: 'Чат не найден' });
  if (!chatVisibleToUser(chat, req.user)) return res.status(403).json({ error: 'Нет доступа к чату' });
  const msg = {
    id: nextId(db.messages), chatId, userId: req.user.id,
    text: trimmedText, mediaUrl: media ? media.url : null, mediaType: media ? media.kind : null,
    forwardedFrom: null, createdAt: Date.now()
  };
  db.messages.push(msg);
  chat.reads = chat.reads || {};
  chat.reads[req.user.id] = msg.createdAt;
  save(db);
  res.json({ message: { ...msg, authorName: req.user.fullName, authorRole: req.user.role, authorAvatarUrl: req.user.avatarUrl, authorAvatarColor: req.user.avatarColor } });
});

// Удаление сообщения в чате (у всех)
app.delete('/api/messages/:id', auth(), (req, res) => {
  const db = load();
  const msg = db.messages.find(m => m.id === Number(req.params.id));
  if (!msg) return res.status(404).json({ error: 'Сообщение не найдено' });
  const chat = db.chats.find(c => c.id === msg.chatId);
  const isDirectMember = chat && chat.type === 'direct' && Array.isArray(chat.members) && chat.members.includes(req.user.id);
  const isPrivileged = req.user.role === 'admin' || req.user.role === 'teacher';
  const isAuthor = msg.userId === req.user.id;

  if (!isAuthor && !isPrivileged && !isDirectMember) {
    return res.status(403).json({ error: 'Можно удалять только свои сообщения' });
  }
  deleteMediaFile(msg.mediaUrl);
  db.messages = db.messages.filter(m => m.id !== msg.id);
  save(db);
  res.json({ ok: true });
});

// Переслать сообщение в другой чат
app.post('/api/messages/:id/forward', auth(), (req, res) => {
  const targetChatId = Number(req.body.targetChatId);
  const db = load();
  const original = db.messages.find(m => m.id === Number(req.params.id));
  if (!original) return res.status(404).json({ error: 'Сообщение не найдено' });
  const originalChat = db.chats.find(c => c.id === original.chatId);
  if (!originalChat || !chatVisibleToUser(originalChat, req.user)) {
    return res.status(403).json({ error: 'Нет доступа к этому сообщению' });
  }
  const targetChat = db.chats.find(c => c.id === targetChatId);
  if (!targetChat || !chatVisibleToUser(targetChat, req.user)) {
    return res.status(403).json({ error: 'Нет доступа к чату назначения' });
  }
  const originalAuthor = db.users.find(u => u.id === original.userId);
  const msg = {
    id: nextId(db.messages), chatId: targetChat.id, userId: req.user.id,
    text: original.text, mediaUrl: original.mediaUrl, mediaType: original.mediaType,
    forwardedFrom: originalAuthor ? originalAuthor.fullName : 'Неизвестный',
    createdAt: Date.now()
  };
  db.messages.push(msg);
  targetChat.reads = targetChat.reads || {};
  targetChat.reads[req.user.id] = msg.createdAt;
  save(db);
  res.json({
    message: { ...msg, authorName: req.user.fullName, authorRole: req.user.role, authorAvatarUrl: req.user.avatarUrl, authorAvatarColor: req.user.avatarColor }
  });
});

// ================= ЗАДАНИЯ =================

// Видит ли студент задание: всем группам, конкретной группе или как поимённо выбранный студент
function assignmentVisibleToStudent(assignment, student) {
  const at = assignment.assignedTo || { type: 'group', groupId: assignment.groupId, studentIds: [] };
  // Если задание назначено всем группам:
  if (at.type === 'all' || at.groupId === 'all' || (at.type === 'group' && (at.groupId === null || at.groupId === undefined || at.groupId === 0))) {
    return true;
  }
  // Обратная совместимость для старых записей без assignedTo:
  if (!assignment.assignedTo && (assignment.groupId === null || assignment.groupId === undefined || assignment.groupId === 'all')) {
    return true;
  }
  if (at.type === 'students') return (at.studentIds || []).includes(student.id);
  return Number(at.groupId) === Number(student.groupId);
}

// Список заданий: студент видит свои (по группе или лично назначенные), преподаватель — свои созданные, админ — все
app.get('/api/assignments', auth(), (req, res) => {
  const db = load();
  let list;
  if (req.user.role === 'student') {
    list = db.assignments.filter(a => assignmentVisibleToStudent(a, req.user));
  } else {
    list = db.assignments;
  }
  list = list.map(a => {
    const at = a.assignedTo || { type: 'group', groupId: a.groupId, studentIds: [] };
    const isAll = at.type === 'all' || at.groupId === 'all' || (at.type === 'group' && (at.groupId === null || at.groupId === undefined));
    const group = db.groups.find(g => g.id === at.groupId);
    const result = {
      ...a,
      groupName: isAll ? 'Все группы' : (at.type === 'students' ? 'Выбранные студенты' : (group ? group.name : '—'))
    };
    if (req.user.role === 'student') {
      const sub = db.submissions.find(s => s.assignmentId === a.id && s.studentId === req.user.id);
      result.mySubmission = sub || null;
      // Пока студент не прошёл тест — не отдаём, какие варианты правильные
      if (a.type === 'test' && (!sub || sub.status !== 'graded')) {
        result.questions = (a.questions || []).map(q => ({
          id: q.id, text: q.text, allowMultiple: q.allowMultiple,
          options: q.options.map(o => ({ id: o.id, text: o.text }))
        }));
      }
    }
    return result;
  });
  res.json({ assignments: list.sort((a, b) => b.createdAt - a.createdAt) });
});

// Создание задания — только преподаватель или админ
app.post('/api/assignments', auth(['teacher', 'admin']), (req, res) => {
  const { title, description, type, assignedTo, xpReward, coinsReward, dueDate, questions, arLocation, imageMediaData } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Укажите название задания' });
  const assignmentType = ['text', 'test', 'ar'].includes(type) ? type : 'text';

  const db = load();

  // Кому назначено: всем группам, конкретной группе или списку конкретных студентов
  const at = assignedTo || {};
  let finalAssignedTo;
  if (at.type === 'all' || at.groupId === 'all' || (at.type === 'group' && (at.groupId === null || at.groupId === undefined))) {
    finalAssignedTo = { type: 'all', groupId: null, studentIds: [] };
  } else if (at.type === 'students') {
    const ids = Array.isArray(at.studentIds) ? at.studentIds.map(Number).filter(n => !Number.isNaN(n)) : [];
    const validIds = ids.filter(id => db.users.some(u => u.id === id && u.role === 'student'));
    if (!validIds.length) return res.status(400).json({ error: 'Выберите хотя бы одного студента' });
    finalAssignedTo = { type: 'students', groupId: null, studentIds: validIds };
  } else {
    const groupId = Number(at.groupId);
    if (!groupId || !db.groups.some(g => g.id === groupId)) {
      return res.status(400).json({ error: 'Выберите группу' });
    }
    finalAssignedTo = { type: 'group', groupId, studentIds: [] };
  }

  let finalQuestions = [];
  let finalArLocation = null;
  let imageUrl = null;

  if (assignmentType === 'test') {
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ error: 'Добавьте хотя бы один вопрос' });
    }
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const opts = Array.isArray(q.options) ? q.options : [];
      if (!q.text || !q.text.trim()) return res.status(400).json({ error: `Вопрос ${qi + 1}: укажите текст вопроса` });
      if (opts.length < 2) return res.status(400).json({ error: `Вопрос ${qi + 1}: нужно минимум 2 варианта ответа` });
      if (!opts.some(o => o.correct)) return res.status(400).json({ error: `Вопрос ${qi + 1}: отметьте хотя бы один правильный вариант` });
    }
    finalQuestions = questions.map((q, qi) => ({
      id: qi + 1,
      text: q.text.trim().slice(0, 500),
      allowMultiple: q.options.filter(o => o.correct).length > 1,
      options: q.options.map((o, oi) => ({ id: oi + 1, text: (o.text || '').trim().slice(0, 300), correct: !!o.correct }))
    }));
  } else if (assignmentType === 'text') {
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Опишите текстовое задание' });
    }
  } else if (assignmentType === 'ar') {
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Оставьте комментарий, обязательный для прочтения на месте' });
    }
    const lat = Number(arLocation && arLocation.lat);
    const lng = Number(arLocation && arLocation.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Отметьте точку на карте или введите корректные координаты' });
    }
    finalArLocation = { lat, lng, label: (arLocation.label || title).trim().slice(0, 120), radiusMeters: 60 };
    if (imageMediaData) {
      const media = saveMediaFromDataUrl(imageMediaData, ASSIGNMENTS_DIR, '/uploads/assignments/');
      if (!media || media.kind !== 'image') {
        return res.status(400).json({ error: 'Для точки интереса нужно фото (jpg/png/gif/webp) до 20 МБ' });
      }
      imageUrl = media.url;
    }
  }

  const assignment = {
    id: nextId(db.assignments),
    title: title.trim(),
    description: (description || '').trim(),
    type: assignmentType,
    assignedTo: finalAssignedTo,
    questions: finalQuestions,
    arLocation: finalArLocation,
    imageUrl,
    groupId: finalAssignedTo.type === 'group' ? finalAssignedTo.groupId : null, // для обратной совместимости
    authorId: req.user.id,
    xpReward: Number(xpReward) || 10,
    coinsReward: Number(coinsReward) || 0,
    dueDate: dueDate || null,
    createdAt: Date.now()
  };
  db.assignments.push(assignment);
  save(db);
  res.json({ assignment });
});

// Точки интереса для карты AR-заданий: студент видит только свои назначенные, преподаватель — свои, админ — все
app.get('/api/ar-points', auth(), (req, res) => {
  const db = load();
  let list = db.assignments.filter(a => a.type === 'ar' && a.arLocation);
  if (req.user.role === 'student') {
    list = list.filter(a => assignmentVisibleToStudent(a, req.user));
  } else if (req.user.role === 'teacher') {
    list = list.filter(a => a.authorId === req.user.id);
  }
  const points = list.map(a => {
    let completed = false;
    if (req.user.role === 'student') {
      const sub = db.submissions.find(s => s.assignmentId === a.id && s.studentId === req.user.id);
      completed = !!(sub && sub.status === 'graded');
    }
    return {
      assignmentId: a.id,
      title: a.title,
      label: a.arLocation.label,
      lat: a.arLocation.lat,
      lng: a.arLocation.lng,
      imageUrl: a.imageUrl || null,
      completed
    };
  });
  res.json({ points });
});

app.delete('/api/assignments/:id', auth(['teacher', 'admin']), (req, res) => {
  const db = load();
  const id = Number(req.params.id);
  const a = db.assignments.find(x => x.id === id);
  if (!a) return res.status(404).json({ error: 'Не найдено' });
  db.assignments = db.assignments.filter(x => x.id !== id);
  db.submissions = db.submissions.filter(x => x.assignmentId !== id);
  save(db);
  res.json({ ok: true });
});

// Студент отправляет решение: тест — автопроверка сразу, текст/AR-заглушка — на ручную проверку преподавателем
app.post('/api/assignments/:id/submit', auth(['student']), (req, res) => {
  const db = load();
  const assignmentId = Number(req.params.id);
  const assignment = db.assignments.find(a => a.id === assignmentId);
  if (!assignment) return res.status(404).json({ error: 'Задание не найдено' });
  if (!assignmentVisibleToStudent(assignment, req.user)) {
    return res.status(403).json({ error: 'Это задание вам не назначено' });
  }

  let sub = db.submissions.find(s => s.assignmentId === assignmentId && s.studentId === req.user.id);

  if (assignment.type === 'test') {
    if (sub && sub.status === 'graded') {
      return res.status(400).json({ error: 'Вы уже проходили этот тест' });
    }
    const answers = req.body.answers || {};
    const questions = assignment.questions || [];
    if (!questions.length) return res.status(400).json({ error: 'В тесте нет вопросов' });

    let correctCount = 0;
    questions.forEach(q => {
      const chosen = new Set((answers[q.id] || []).map(String));
      const correctIds = new Set(q.options.filter(o => o.correct).map(o => String(o.id)));
      const isCorrect = chosen.size === correctIds.size && [...chosen].every(id => correctIds.has(id));
      if (isCorrect) correctCount++;
    });
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const xpAwarded = Math.round(assignment.xpReward * (scorePercent / 100));
    const coinsAwarded = Math.round((assignment.coinsReward || 0) * (scorePercent / 100));
    const now = Date.now();

    if (sub) {
      sub.answers = answers; sub.status = 'graded'; sub.autoScore = scorePercent;
      sub.grade = `${scorePercent}%`; sub.xpAwarded = xpAwarded; sub.coinsAwarded = coinsAwarded; sub.gradedAt = now; sub.createdAt = now;
    } else {
      sub = {
        id: nextId(db.submissions), assignmentId, studentId: req.user.id,
        text: '', answers, status: 'graded', autoScore: scorePercent,
        grade: `${scorePercent}%`, xpAwarded, coinsAwarded, createdAt: now, gradedAt: now
      };
      db.submissions.push(sub);
    }
    const student = db.users.find(u => u.id === req.user.id);
    student.xp += xpAwarded;
    student.coins = (student.coins || 0) + coinsAwarded;
    student.level = levelFromXp(student.xp);
    save(db);
    return res.json({ submission: sub, correctCount, totalQuestions: questions.length, user: publicUser(student) });
  }

  // AR-точка интереса: студент подтверждает, что нашёл место, монетки и XP начисляются сразу
  if (assignment.type === 'ar') {
    if (sub && sub.status === 'graded') {
      return res.status(400).json({ error: 'Вы уже отметили эту точку интереса' });
    }
    const loc = assignment.arLocation;
    const { lat, lng } = req.body;
    if (loc && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      const distance = haversineMeters(loc.lat, loc.lng, Number(lat), Number(lng));
      if (distance > (loc.radiusMeters || 60) + 40) { // небольшой запас на погрешность GPS
        return res.status(400).json({ error: 'Вы ещё не рядом с точкой интереса' });
      }
    }
    const now = Date.now();
    if (sub) {
      sub.status = 'graded'; sub.xpAwarded = assignment.xpReward; sub.coinsAwarded = assignment.coinsReward || 0;
      sub.text = 'Отметил(а) посещение точки интереса'; sub.gradedAt = now; sub.createdAt = now;
    } else {
      sub = {
        id: nextId(db.submissions), assignmentId, studentId: req.user.id,
        text: 'Отметил(а) посещение точки интереса', status: 'graded',
        xpAwarded: assignment.xpReward, coinsAwarded: assignment.coinsReward || 0,
        createdAt: now, gradedAt: now
      };
      db.submissions.push(sub);
    }
    const student = db.users.find(u => u.id === req.user.id);
    student.xp += sub.xpAwarded;
    student.coins = (student.coins || 0) + sub.coinsAwarded;
    student.level = levelFromXp(student.xp);
    save(db);
    return res.json({ submission: sub, user: publicUser(student) });
  }

  // Текстовое задание — письменный ответ, проверяет преподаватель
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Пустой ответ' });
  if (sub) {
    sub.text = text.trim();
    sub.status = 'pending';
    sub.createdAt = Date.now();
  } else {
    sub = {
      id: nextId(db.submissions), assignmentId, studentId: req.user.id,
      text: text.trim(), status: 'pending', xpAwarded: 0, grade: null,
      createdAt: Date.now(), gradedAt: null
    };
    db.submissions.push(sub);
  }
  save(db);
  res.json({ submission: sub });
});

// Преподаватель смотрит ответы по заданию
app.get('/api/assignments/:id/submissions', auth(['teacher', 'admin']), (req, res) => {
  const db = load();
  const assignmentId = Number(req.params.id);
  const subs = db.submissions
    .filter(s => s.assignmentId === assignmentId)
    .map(s => {
      const student = db.users.find(u => u.id === s.studentId);
      return { ...s, studentName: student ? student.fullName : '???' };
    });
  res.json({ submissions: subs });
});

// Преподаватель оценивает письменный ответ и начисляет опыт и монеты (для тестов оценка ставится автоматически)
app.post('/api/submissions/:id/grade', auth(['teacher', 'admin']), (req, res) => {
  const { grade, xpAwarded, coinsAwarded } = req.body;
  const db = load();
  const sub = db.submissions.find(s => s.id === Number(req.params.id));
  if (!sub) return res.status(404).json({ error: 'Ответ не найден' });
  const newXp = Number(xpAwarded) || 0;
  const newCoins = Number(coinsAwarded) || 0;
  const student = db.users.find(u => u.id === sub.studentId);
  if (student) {
    // При повторной оценке сначала откатываем ранее начисленное, чтобы не начислить дважды
    student.xp = student.xp - (sub.xpAwarded || 0) + newXp;
    student.coins = (student.coins || 0) - (sub.coinsAwarded || 0) + newCoins;
    student.level = levelFromXp(student.xp);
  }
  sub.status = 'graded';
  sub.grade = grade || null;
  sub.xpAwarded = newXp;
  sub.coinsAwarded = newCoins;
  sub.gradedAt = Date.now();
  save(db);
  res.json({ submission: sub, student: student ? publicUser(student) : null });
});

// ================= ЛЕНТА НОВОСТЕЙ И ПОСТЫ ПРОФИЛЯ =================

function publicPost(p, db, currentUserId) {
  const author = db.users.find(u => u.id === p.authorId);
  return {
    id: p.id,
    authorId: p.authorId,
    authorName: author ? author.fullName : '???',
    authorRole: author ? author.role : null,
    authorAvatarUrl: author ? author.avatarUrl : null,
    authorAvatarColor: author ? author.avatarColor : 'orange',
    target: p.target,
    text: p.text,
    mediaUrl: p.mediaUrl || null,
    mediaType: p.mediaType || null,
    createdAt: p.createdAt,
    likesCount: (p.likes || []).length,
    likedByMe: !!(p.likes || []).includes(currentUserId)
  };
}

// Общая лента: видят все авторизованные пользователи, но в ней только посты,
// опубликованные преподавателями/администрацией (target === 'feed')
app.get('/api/posts/feed', auth(), (req, res) => {
  const db = load();
  const list = db.posts
    .filter(p => p.target === 'feed')
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => publicPost(p, db, req.user.id));
  res.json({ posts: list });
});

// ================= ДРУЗЬЯ И СВЯЗИ ОПЕРАТОРОВ =================

function getFriendshipStatus(db, myId, targetId) {
  if (myId === targetId) return 'self';
  db.friendships = db.friendships || [];
  const record = db.friendships.find(f =>
    (f.userId === myId && f.friendId === targetId) ||
    (f.userId === targetId && f.friendId === myId)
  );
  if (!record) return 'none';
  if (record.status === 'accepted') return 'friends';
  if (record.userId === myId && record.friendId === targetId) return 'outgoing';
  if (record.userId === targetId && record.friendId === myId) return 'incoming';
  return 'none';
}

function countUserFriends(db, userId) {
  db.friendships = db.friendships || [];
  return db.friendships.filter(f =>
    f.status === 'accepted' && (f.userId === userId || f.friendId === userId)
  ).length;
}

// Список друзей, входящих и исходящих заявок
app.get('/api/friends', auth(), (req, res) => {
  const db = load();
  db.friendships = db.friendships || [];
  const myId = req.user.id;

  const acceptedRecords = db.friendships.filter(f =>
    f.status === 'accepted' && (f.userId === myId || f.friendId === myId)
  );
  const friends = acceptedRecords.map(f => {
    const otherId = f.userId === myId ? f.friendId : f.userId;
    const userObj = db.users.find(u => u.id === otherId);
    return userObj ? publicUser(userObj) : null;
  }).filter(Boolean);

  const incomingRecords = db.friendships.filter(f =>
    f.status === 'pending' && f.friendId === myId
  );
  const incoming = incomingRecords.map(f => {
    const userObj = db.users.find(u => u.id === f.userId);
    const pub = userObj ? publicUser(userObj) : null;
    return pub ? { id: f.id, user: pub, sender: pub, createdAt: f.createdAt } : null;
  }).filter(Boolean);

  const outgoingRecords = db.friendships.filter(f =>
    f.status === 'pending' && f.userId === myId
  );
  const outgoing = outgoingRecords.map(f => {
    const userObj = db.users.find(u => u.id === f.friendId);
    const pub = userObj ? publicUser(userObj) : null;
    return pub ? { id: f.id, user: pub, recipient: pub, createdAt: f.createdAt } : null;
  }).filter(Boolean);

  res.json({ friends, incoming, outgoing });
});

// Отправить заявку в друзья
app.post('/api/friends/request', auth(), (req, res) => {
  const targetUserId = Number(req.body.targetUserId);
  if (!targetUserId || targetUserId === req.user.id) {
    return res.status(400).json({ error: 'Некорректный пользователь' });
  }
  const db = load();
  db.friendships = db.friendships || [];
  const target = db.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });

  const myId = req.user.id;
  const existing = db.friendships.find(f =>
    (f.userId === myId && f.friendId === targetUserId) ||
    (f.userId === targetUserId && f.friendId === myId)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      return res.json({ ok: true, status: 'friends', message: 'Вы уже друзья' });
    }
    if (existing.userId === targetUserId && existing.friendId === myId) {
      existing.status = 'accepted';
      existing.acceptedAt = Date.now();
      save(db);
      return res.json({ ok: true, status: 'friends', message: `Вы и ${target.fullName} теперь друзья!` });
    }
    return res.json({ ok: true, status: 'outgoing', message: 'Запрос уже отправлен' });
  }

  const newReq = {
    id: nextId(db.friendships),
    userId: myId,
    friendId: targetUserId,
    status: 'pending',
    createdAt: Date.now()
  };
  db.friendships.push(newReq);
  save(db);
  res.json({ ok: true, status: 'outgoing', message: 'Запрос в друзья отправлен!' });
});

// Принять заявку в друзья
app.post('/api/friends/accept', auth(), (req, res) => {
  const db = load();
  db.friendships = db.friendships || [];
  const myId = req.user.id;
  const { requestId, userId } = req.body;

  const record = db.friendships.find(f =>
    f.status === 'pending' && f.friendId === myId &&
    ((requestId && f.id === Number(requestId)) || (userId && f.userId === Number(userId)))
  );
  if (!record) return res.status(404).json({ error: 'Запрос в друзья не найден' });

  record.status = 'accepted';
  record.acceptedAt = Date.now();
  save(db);

  const friendUser = db.users.find(u => u.id === record.userId);
  res.json({ ok: true, friend: friendUser ? publicUser(friendUser) : null, message: 'Запрос принят!' });
});

// Отклонить / отменить заявку в друзья
app.post('/api/friends/decline', auth(), (req, res) => {
  const db = load();
  db.friendships = db.friendships || [];
  const myId = req.user.id;
  const { requestId, userId } = req.body;

  db.friendships = db.friendships.filter(f => {
    const match = f.status === 'pending' &&
      ((f.friendId === myId && ((requestId && f.id === Number(requestId)) || (userId && f.userId === Number(userId)))) ||
       (f.userId === myId && ((requestId && f.id === Number(requestId)) || (userId && f.friendId === Number(userId)))));
    return !match;
  });
  save(db);
  res.json({ ok: true, message: 'Запрос отклонён' });
});

// Удалить из друзей
app.post('/api/friends/remove', auth(), (req, res) => {
  const friendId = Number(req.body.friendId || req.body.userId);
  if (!friendId) return res.status(400).json({ error: 'Укажите ID пользователя' });
  const db = load();
  db.friendships = db.friendships || [];
  const myId = req.user.id;

  db.friendships = db.friendships.filter(f =>
    !((f.userId === myId && f.friendId === friendId) || (f.userId === friendId && f.friendId === myId))
  );
  save(db);
  res.json({ ok: true, message: 'Пользователь удалён из друзей' });
});

// Просмотр профиля пользователя
app.get('/api/users/:id', auth(), (req, res) => {
  const db = load();
  const userId = Number(req.params.id);
  const target = db.users.find(u => u.id === userId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });

  res.json({
    user: publicUser(target),
    friendshipStatus: getFriendshipStatus(db, req.user.id, target.id),
    friendsCount: countUserFriends(db, target.id)
  });
});

// Посты конкретного пользователя — для оформления его профиля (фото/истории/видео)
app.get('/api/users/:id/posts', auth(), (req, res) => {
  const db = load();
  const userId = Number(req.params.id);
  const target = db.users.find(u => u.id === userId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
  const list = db.posts
    .filter(p => p.authorId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => publicPost(p, db, req.user.id));
  res.json({
    user: publicUser(target),
    posts: list,
    friendshipStatus: getFriendshipStatus(db, req.user.id, target.id),
    friendsCount: countUserFriends(db, target.id)
  });
});

// Создание поста. Студенты могут публиковать только в свой профиль.
// Преподаватели/админ могут опубликовать и в общую ленту, и просто в свой профиль.
app.post('/api/posts', auth(), (req, res) => {
  const { text, target, mediaData } = req.body;
  const trimmedText = (text || '').trim().slice(0, 2000);

  let media = null;
  if (mediaData) {
    media = saveMediaFromDataUrl(mediaData);
    if (!media) {
      return res.status(400).json({ error: 'Неподдерживаемый файл: разрешены фото (jpg/png/gif/webp) и видео (mp4/webm/mov) до 20 МБ' });
    }
  }

  if (!trimmedText && !media) {
    return res.status(400).json({ error: 'Добавьте текст, фото или видео' });
  }

  const canPostToFeed = req.user.role === 'teacher' || req.user.role === 'admin';
  const finalTarget = (canPostToFeed && target === 'feed') ? 'feed' : 'profile';

  const db = load();
  const post = {
    id: nextId(db.posts),
    authorId: req.user.id,
    target: finalTarget,
    text: trimmedText,
    mediaUrl: media ? media.url : null,
    mediaType: media ? media.kind : null,
    createdAt: Date.now(),
    likes: []
  };
  db.posts.push(post);
  save(db);
  res.json({ post: publicPost(post, db, req.user.id) });
});

app.delete('/api/posts/:id', auth(), (req, res) => {
  const db = load();
  const id = Number(req.params.id);
  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  if (post.authorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Это не ваш пост' });
  }
  deleteMediaFile(post.mediaUrl);
  db.posts = db.posts.filter(p => p.id !== id);
  save(db);
  res.json({ ok: true });
});

app.post('/api/posts/:id/like', auth(), (req, res) => {
  const db = load();
  const id = Number(req.params.id);
  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  post.likes = post.likes || [];
  const idx = post.likes.indexOf(req.user.id);
  if (idx === -1) post.likes.push(req.user.id);
  else post.likes.splice(idx, 1);
  save(db);
  res.json({ post: publicPost(post, db, req.user.id) });
});

// ================= ИСТОРИИ (STORIES) =================

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 часа

// Удаляет из базы просроченные истории и их файлы; вызывается перед каждым чтением/записью историй
function pruneExpiredStories(db) {
  const now = Date.now();
  const expired = db.stories.filter(s => now - s.createdAt > STORY_LIFETIME_MS);
  if (!expired.length) return false;
  expired.forEach(s => deleteMediaFile(s.mediaUrl));
  db.stories = db.stories.filter(s => now - s.createdAt <= STORY_LIFETIME_MS);
  return true;
}

function publicStory(s, currentUserId) {
  return {
    id: s.id,
    authorId: s.authorId,
    text: s.text,
    mediaUrl: s.mediaUrl || null,
    mediaType: s.mediaType || null,
    createdAt: s.createdAt,
    viewedByMe: !!(s.viewedBy || []).includes(currentUserId)
  };
}

// Список активных историй, сгруппированных по автору (своя история — всегда первая)
app.get('/api/stories', auth(), (req, res) => {
  const db = load();
  if (pruneExpiredStories(db)) save(db);

  const byAuthor = new Map();
  for (const s of db.stories.sort((a, b) => a.createdAt - b.createdAt)) {
    if (!byAuthor.has(s.authorId)) byAuthor.set(s.authorId, []);
    byAuthor.get(s.authorId).push(publicStory(s, req.user.id));
  }

  let groups = Array.from(byAuthor.entries()).map(([authorId, stories]) => {
    const author = db.users.find(u => u.id === authorId);
    return {
      authorId,
      authorName: author ? author.fullName : '???',
      authorRole: author ? author.role : null,
      authorAvatarUrl: author ? author.avatarUrl : null,
      authorAvatarColor: author ? author.avatarColor : 'orange',
      hasUnseen: stories.some(s => !s.viewedByMe),
      stories
    };
  });

  groups.sort((a, b) => {
    if (a.authorId === req.user.id) return -1;
    if (b.authorId === req.user.id) return 1;
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return b.stories[b.stories.length - 1].createdAt - a.stories[a.stories.length - 1].createdAt;
  });

  res.json({ groups });
});

app.post('/api/stories', auth(), (req, res) => {
  const { text, mediaData } = req.body;
  const trimmedText = (text || '').trim().slice(0, 300);
  let media = null;
  if (mediaData) {
    media = saveMediaFromDataUrl(mediaData, STORIES_DIR, '/uploads/stories/');
    if (!media) {
      return res.status(400).json({ error: 'Неподдерживаемый файл: разрешены фото (jpg/png/gif/webp) и видео (mp4/webm/mov) до 20 МБ' });
    }
  }
  if (!trimmedText && !media) {
    return res.status(400).json({ error: 'Добавьте текст, фото или видео' });
  }
  const db = load();
  pruneExpiredStories(db);
  const story = {
    id: nextId(db.stories), authorId: req.user.id, text: trimmedText,
    mediaUrl: media ? media.url : null, mediaType: media ? media.kind : null,
    createdAt: Date.now(), viewedBy: [req.user.id]
  };
  db.stories.push(story);
  save(db);
  res.json({ story: publicStory(story, req.user.id) });
});

app.post('/api/stories/:id/view', auth(), (req, res) => {
  const db = load();
  const story = db.stories.find(s => s.id === Number(req.params.id));
  if (!story) return res.status(404).json({ error: 'История не найдена' });
  story.viewedBy = story.viewedBy || [];
  if (!story.viewedBy.includes(req.user.id)) story.viewedBy.push(req.user.id);
  save(db);
  res.json({ ok: true });
});

app.delete('/api/stories/:id', auth(), (req, res) => {
  const db = load();
  const story = db.stories.find(s => s.id === Number(req.params.id));
  if (!story) return res.status(404).json({ error: 'История не найдена' });
  if (story.authorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Это не ваша история' });
  }
  deleteMediaFile(story.mediaUrl);
  db.stories = db.stories.filter(s => s.id !== story.id);
  save(db);
  res.json({ ok: true });
});

// ================= МАГАЗИН (МЕРЧ, СТИЛИ И ГАРДЕРОБ ПИТОМЦА) =================

function publicProduct(p) {
  return {
    id: p.id,
    code: p.code || null,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl || null,
    priceCoins: p.priceCoins,
    category: p.category || 'merch', // 'merch' | 'style' | 'pet'
    colorHex: p.colorHex || null,
    slot: p.slot || null,
    rarity: p.rarity || 'common',
    petType: p.petType || null,
    setName: p.setName || null,
    icon: p.icon || null,
    active: p.active !== false,
    createdAt: p.createdAt
  };
}

// Список товаров — видят все авторизованные пользователи
app.get('/api/products', auth(), (req, res) => {
  const db = load();
  const list = db.products.filter(p => p.active !== false).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ products: list.map(publicProduct) });
});

// Добавление товара / стиля / предмета — только администратор
app.post('/api/admin/products', auth(['admin']), (req, res) => {
  const { name, description, priceCoins, mediaData, category, colorHex, slot, icon } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Укажите название товара/стиля' });
  const price = Number(priceCoins);
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'Укажите корректную цену в монетах' });

  const cat = ['merch', 'style', 'pet'].includes(category) ? category : 'merch';

  let imageUrl = null;
  if (mediaData) {
    const media = saveMediaFromDataUrl(mediaData, PRODUCTS_DIR, '/uploads/products/');
    if (!media || media.kind !== 'image') {
      return res.status(400).json({ error: 'Для товара нужно фото (jpg/png/gif/webp) до 20 МБ' });
    }
    imageUrl = media.url;
  }

  const db = load();
  const product = {
    id: nextId(db.products),
    name: name.trim().slice(0, 120),
    description: (description || '').trim().slice(0, 500),
    imageUrl,
    category: cat,
    colorHex: cat === 'style' ? (colorHex || '#FF4D1C') : null,
    slot: cat === 'pet' ? (slot || 'hat') : null,
    icon: icon || (cat === 'style' ? '🎨' : cat === 'pet' ? '🐾' : '📦'),
    priceCoins: Math.round(price),
    active: true,
    createdAt: Date.now()
  };
  db.products.push(product);
  save(db);
  res.json({ product: publicProduct(product) });
});

app.delete('/api/admin/products/:id', auth(['admin']), (req, res) => {
  const db = load();
  const product = db.products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  deleteMediaFile(product.imageUrl);
  db.products = db.products.filter(p => p.id !== product.id);
  save(db);
  res.json({ ok: true });
});

// Покупка товара (мерч, неоновый стиль интерфейса или гардероб питомца)
app.post('/api/shop/buy', auth(), (req, res) => {
  const productId = Number(req.body.productId);
  const db = load();
  const product = db.products.find(p => p.id === productId && p.active !== false);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  const user = db.users.find(u => u.id === req.user.id);
  if ((user.coins || 0) < product.priceCoins) {
    return res.status(400).json({ error: 'Недостаточно золотых монеток Hermes' });
  }

  // 1. Покупка стиля (цветового акцента интерфейса):
  if (product.category === 'style') {
    user.unlockedColors = user.unlockedColors || ['#FF4D1C'];
    if (user.unlockedColors.includes(product.colorHex)) {
      return res.status(400).json({ error: 'Этот цвет уже разблокирован в вашей палитре!' });
    }
    user.coins -= product.priceCoins;
    user.unlockedColors.push(product.colorHex);
    const purchase = {
      id: nextId(db.purchases),
      userId: user.id,
      productId: product.id,
      productName: product.name,
      priceCoins: product.priceCoins,
      createdAt: Date.now(),
      status: 'fulfilled'
    };
    db.purchases.push(purchase);
    save(db);
    return res.json({ purchase, user: publicUser(user), message: `Стиль «${product.name}» успешно разблокирован!` });
  }

  // 2. Покупка предмета гардероба питомца:
  if (product.category === 'pet') {
    ensureUserPet(user);
    const itemKey = product.code || `item_${product.id}`;
    const altKey = `item_${product.id}`;
    if (user.pet.inventory.includes(itemKey) || user.pet.inventory.includes(altKey)) {
      return res.status(400).json({ error: 'Этот модуль уже есть в инвентаре спутника!' });
    }
    user.coins -= product.priceCoins;
    user.pet.inventory.push(itemKey);
    if (product.code && !user.pet.inventory.includes(altKey)) {
      user.pet.inventory.push(altKey);
    }
    if (product.slot) {
      let targetSlot = product.slot;
      if (targetSlot === 'hat') targetSlot = 'head';
      if (targetSlot === 'outfit') targetSlot = 'body';
      if (targetSlot === 'boots') targetSlot = 'limbs';
      user.pet.equipped[targetSlot] = itemKey;
      if (targetSlot === 'head') user.pet.equipped.hat = itemKey;
      if (targetSlot === 'body') user.pet.equipped.outfit = itemKey;
      if (targetSlot === 'limbs') user.pet.equipped.boots = itemKey;
    }
    const purchase = {
      id: nextId(db.purchases),
      userId: user.id,
      productId: product.id,
      productName: product.name,
      priceCoins: product.priceCoins,
      createdAt: Date.now(),
      status: 'fulfilled'
    };
    db.purchases.push(purchase);
    save(db);
    return res.json({ purchase, user: publicUser(user), pet: user.pet, message: `Предмет «${product.name}» добавлен в гардероб питомца!` });
  }

  // 3. Покупка физического мерча (требует подтверждения выдачи):
  user.coins -= product.priceCoins;
  const purchase = {
    id: nextId(db.purchases),
    userId: user.id,
    productId: product.id,
    productName: product.name,
    priceCoins: product.priceCoins,
    createdAt: Date.now(),
    status: 'ordered'
  };
  db.purchases.push(purchase);
  save(db);
  res.json({ purchase, user: publicUser(user) });
});

app.get('/api/shop/my-purchases', auth(), (req, res) => {
  const db = load();
  const list = db.purchases
    .filter(p => p.userId === req.user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ purchases: list });
});

app.get('/api/admin/purchases', auth(['admin']), (req, res) => {
  const db = load();
  const list = db.purchases.map(p => {
    const user = db.users.find(u => u.id === p.userId);
    return { ...p, userName: user ? user.fullName : '(удалён)' };
  }).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ purchases: list });
});

app.post('/api/admin/purchases/:id/fulfill', auth(['admin']), (req, res) => {
  const db = load();
  const p = db.purchases.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Заказ не найден' });
  p.status = 'fulfilled';
  save(db);
  res.json({ ok: true });
});

// Отмена заказа администратором — возвращает монеты студенту
app.delete('/api/admin/purchases/:id', auth(['admin']), (req, res) => {
  const db = load();
  const p = db.purchases.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Заказ не найден' });
  const student = db.users.find(u => u.id === p.userId);
  if (student && p.status !== 'fulfilled') {
    student.coins = (student.coins || 0) + p.priceCoins;
  }
  db.purchases = db.purchases.filter(x => x.id !== p.id);
  save(db);
  res.json({ ok: true });
});

// ================= ЕЖЕДНЕВНЫЕ НАГРАДЫ (DAILY STREAK) =================

app.get('/api/daily-rewards/status', auth(), (req, res) => {
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const streak = ensureUserDailyState(user);
  const todayIsoDay = getIsoDayOfWeek();

  const claimed = streak.claimedDays || [];
  const days = DAILY_REWARDS_CONFIG.map(cfg => {
    let status = 'upcoming'; // 'claimed' | 'can_claim' | 'missed' | 'upcoming'
    if (claimed.includes(cfg.day)) {
      status = 'claimed';
    } else if (cfg.day === todayIsoDay) {
      status = streak.isBroken ? 'missed' : 'can_claim';
    } else if (cfg.day < todayIsoDay) {
      status = 'missed';
    } else {
      status = streak.isBroken ? 'missed' : 'upcoming';
    }
    return { ...cfg, status };
  });

  const canClaimToday = !streak.isBroken && !claimed.includes(todayIsoDay);
  const todayConfig = DAILY_REWARDS_CONFIG.find(c => c.day === todayIsoDay);

  save(db);
  res.json({
    weekStart: streak.weekStart,
    currentDay: todayIsoDay,
    claimedDays: claimed,
    isBroken: streak.isBroken,
    canClaimToday,
    todayReward: todayConfig,
    days
  });
});

app.post('/api/daily-rewards/claim', auth(), (req, res) => {
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const streak = ensureUserDailyState(user);
  const todayIsoDay = getIsoDayOfWeek();

  if (streak.isBroken) {
    return res.status(400).json({ error: 'Серия дней прервана на этой неделе. Следующая начнется в понедельник.' });
  }

  const claimed = streak.claimedDays || [];
  if (claimed.includes(todayIsoDay)) {
    return res.status(400).json({ error: 'Награда за сегодняшний день уже получена!' });
  }

  const todayConfig = DAILY_REWARDS_CONFIG.find(c => c.day === todayIsoDay);
  if (!todayConfig) return res.status(400).json({ error: 'Ошибка конфигурации дня' });

  // Начисляем награды
  claimed.push(todayIsoDay);
  streak.claimedDays = claimed;
  streak.lastClaimDate = todayStr();

  user.coins = (user.coins || 0) + todayConfig.coins;
  user.xp = (user.xp || 0) + todayConfig.xp;
  user.level = levelFromXp(user.xp);

  // Бонус питомцу за ежедневный вход хозяина
  ensureUserPet(user);
  user.pet.hunger = Math.min(100, (user.pet.hunger || 70) + 30);
  user.pet.happiness = Math.min(100, (user.pet.happiness || 80) + 25);
  user.pet.xp = (user.pet.xp || 0) + 50;
  user.pet.level = Math.floor(user.pet.xp / 100) + 1;

  save(db);

  res.json({
    ok: true,
    claimedDay: todayIsoDay,
    reward: todayConfig,
    user: publicUser(user),
    pet: user.pet
  });
});

// ================= КИБЕР-ПИТОМЕЦ (HERMES COMPANION) =================

app.get('/api/pet', auth(), (req, res) => {
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const pet = ensureUserPet(user);
  save(db);
  res.json({ pet });
});

app.post('/api/pet/feed', auth(), (req, res) => {
  const { foodType } = req.body; // 'battery' | 'crystal' | 'pie'
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const pet = ensureUserPet(user);

  let costCoins = 0;
  let hungerBoost = 25;
  let happinessBoost = 15;
  let xpGain = 15;
  let message = '';

  if (foodType === 'crystal') {
    costCoins = 10;
    hungerBoost = 50;
    happinessBoost = 30;
    xpGain = 40;
    message = 'Питомец поглотил Энерго-Кристалл! +50% Сытости, +40 XP!';
  } else if (foodType === 'pie') {
    costCoins = 25;
    hungerBoost = 100;
    happinessBoost = 50;
    xpGain = 100;
    message = 'Квантовое лакомство! Сытость 100%, +100 XP, море радости!';
  } else {
    // Бесплатная нано-батарея (battery) раз в час
    const lastFree = pet.lastFreeFedAt || 0;
    if (Date.now() - lastFree < 60 * 60 * 1000) {
      const waitMin = Math.ceil((60 * 60 * 1000 - (Date.now() - lastFree)) / 60000);
      return res.status(400).json({ error: `Бесплатная нано-батарея перезаряжается. Ждите еще ${waitMin} мин. Или используйте энерго-кристалл.` });
    }
    pet.lastFreeFedAt = Date.now();
    message = 'Питомец заряжен нано-батареей! +25% Сытости.';
  }

  if (costCoins > 0) {
    if ((user.coins || 0) < costCoins) {
      return res.status(400).json({ error: `Недостаточно монет! Требуется ${costCoins} ⟠.` });
    }
    user.coins -= costCoins;
  }

  pet.hunger = Math.min(100, (pet.hunger || 0) + hungerBoost);
  pet.happiness = Math.min(100, (pet.happiness || 0) + happinessBoost);
  pet.xp = (pet.xp || 0) + xpGain;
  pet.level = Math.floor(pet.xp / 100) + 1;
  pet.lastFedAt = Date.now();

  save(db);
  res.json({ pet, user: publicUser(user), message });
});

app.post('/api/pet/choose', auth(), (req, res) => {
  const { petType, name } = req.body;
  if (!['cat', 'owl', 'snake', 'spider'].includes(petType)) {
    return res.status(400).json({ error: 'Некорректный тип спутника. Доступны: cat, owl, snake, spider' });
  }
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const pet = ensureUserPet(user);

  const defaultNames = {
    cat: 'БАСТЕТ-09',
    owl: 'НОКТУА-04',
    snake: 'УРОБОРОС-07',
    spider: 'АРАХНЕ-08'
  };

  pet.petType = petType;
  pet.name = (name && name.trim()) ? name.trim().slice(0, 30) : defaultNames[petType];

  // Выдаем стартовый набор (Обычный сет выбранного питомца)
  const starterItems = [
    `${petType}_head_common`,
    `${petType}_body_common`,
    `${petType}_limbs_common`
  ];
  starterItems.forEach(itemCode => {
    if (!pet.inventory.includes(itemCode)) {
      pet.inventory.push(itemCode);
    }
    const matched = db.products.find(p => p.code === itemCode);
    if (matched && !pet.inventory.includes(`item_${matched.id}`)) {
      pet.inventory.push(`item_${matched.id}`);
    }
  });

  pet.equipped = pet.equipped || {};
  pet.equipped.head = `${petType}_head_common`;
  pet.equipped.body = `${petType}_body_common`;
  pet.equipped.limbs = `${petType}_limbs_common`;
  pet.equipped.hat = pet.equipped.head;
  pet.equipped.outfit = pet.equipped.body;
  pet.equipped.boots = pet.equipped.limbs;
  pet.equipped.color = pet.equipped.color || '#FF4D1C';

  pet.hunger = 100;
  pet.happiness = 100;
  pet.energy = 100;
  pet.lastFedAt = Date.now();

  save(db);
  res.json({ pet, user: publicUser(user), message: `Платформа [${pet.name}] успешно инициализирована!` });
});

app.post('/api/pet/play', auth(), (req, res) => {
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const pet = ensureUserPet(user);

  pet.happiness = Math.min(100, (pet.happiness || 0) + 15);
  pet.xp = (pet.xp || 0) + 10;
  pet.level = Math.floor(pet.xp / 100) + 1;

  const phrases = [
    '*Оптические сканеры активированы в режиме синхронизации*',
    '«Синхронизация с оператором 100%. Готов к выполнению директив.»',
    '*Микро-сервоприводы издают довольный высокочастотный гул*',
    '«Энергетический баланс ядра в норме. Готов к обучению!»',
    '*Выполняет калибровочный разворот в воздухе*'
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  save(db);
  res.json({ pet, phrase });
});

app.post('/api/pet/equip', auth(), (req, res) => {
  let { slot, itemId } = req.body;
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const pet = ensureUserPet(user);

  if (slot === 'hat') slot = 'head';
  if (slot === 'outfit') slot = 'body';
  if (slot === 'boots') slot = 'limbs';

  if (!['head', 'body', 'limbs', 'color'].includes(slot)) {
    return res.status(400).json({ error: 'Некорректный слот экипировки' });
  }

  if (slot === 'color') {
    const colors = user.unlockedColors || ['#FF4D1C'];
    if (itemId && !colors.includes(itemId)) {
      return res.status(400).json({ error: 'Этот цвет не разблокирован' });
    }
    pet.equipped.color = itemId || '#FF4D1C';
  } else {
    if (itemId) {
      // Find matching product in catalog across all representations
      let matchedProduct = null;
      if (typeof itemId === 'string' && itemId.startsWith('item_')) {
        const numId = Number(itemId.replace('item_', ''));
        matchedProduct = db.products.find(p => p.id === numId);
      } else if (!isNaN(Number(itemId)) && typeof itemId !== 'boolean') {
        matchedProduct = db.products.find(p => p.id === Number(itemId));
      } else {
        matchedProduct = db.products.find(p => p.code === itemId);
      }

      // Check ownership in pet.inventory across itemId, code, and item_ID
      const ownsDirect = pet.inventory.includes(itemId);
      const ownsByCode = matchedProduct && matchedProduct.code && pet.inventory.includes(matchedProduct.code);
      const ownsById = matchedProduct && pet.inventory.includes(`item_${matchedProduct.id}`);

      if (!ownsDirect && !ownsByCode && !ownsById) {
        return res.status(400).json({ error: 'Модуль не найден в инвентаре спутника' });
      }

      // Canonical key to equip
      const canonicalKey = matchedProduct?.code || (matchedProduct ? `item_${matchedProduct.id}` : itemId);

      // Store both aliases in inventory for seamless future operations
      if (matchedProduct?.code && !pet.inventory.includes(matchedProduct.code)) {
        pet.inventory.push(matchedProduct.code);
      }
      if (matchedProduct?.id && !pet.inventory.includes(`item_${matchedProduct.id}`)) {
        pet.inventory.push(`item_${matchedProduct.id}`);
      }
      if (typeof itemId === 'string' && !pet.inventory.includes(itemId)) {
        pet.inventory.push(itemId);
      }

      pet.equipped[slot] = canonicalKey;
      if (slot === 'head') pet.equipped.hat = canonicalKey;
      if (slot === 'body') pet.equipped.outfit = canonicalKey;
      if (slot === 'limbs') pet.equipped.boots = canonicalKey;
    } else {
      // Unequip item
      pet.equipped[slot] = null;
      if (slot === 'head') pet.equipped.hat = null;
      if (slot === 'body') pet.equipped.outfit = null;
      if (slot === 'limbs') pet.equipped.boots = null;
    }
  }

  save(db);
  res.json({ pet });
});

app.post('/api/pet/rename', auth(), (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Укажите имя питомца' });
  const db = load();
  const user = db.users.find(u => u.id === req.user.id);
  const pet = ensureUserPet(user);
  pet.name = name.trim().slice(0, 30);
  save(db);
  res.json({ pet });
});

// ================= ЖАЛОБЫ НА ПОЛЬЗОВАТЕЛЕЙ =================

app.post('/api/reports', auth(), (req, res) => {
  const { reportedUserId, reason, contextType, contextId } = req.body;
  const id = Number(reportedUserId);
  if (!id || id === req.user.id) return res.status(400).json({ error: 'Некорректный пользователь' });
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Опишите причину жалобы' });
  const db = load();
  if (!db.users.some(u => u.id === id)) return res.status(404).json({ error: 'Пользователь не найден' });
  const report = {
    id: nextId(db.reports),
    reporterId: req.user.id,
    reportedUserId: id,
    reason: reason.trim().slice(0, 500),
    context: contextType ? { type: contextType, id: contextId || null } : null,
    createdAt: Date.now(),
    status: 'open'
  };
  db.reports.push(report);
  save(db);
  res.json({ ok: true });
});

app.get('/api/admin/reports', auth(['admin']), (req, res) => {
  const db = load();
  const list = db.reports.map(r => {
    const reporter = db.users.find(u => u.id === r.reporterId);
    const reported = db.users.find(u => u.id === r.reportedUserId);
    return {
      ...r,
      reporterName: reporter ? reporter.fullName : '(удалён)',
      reportedName: reported ? reported.fullName : '(удалён)'
    };
  }).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ reports: list });
});

app.post('/api/admin/reports/:id/resolve', auth(['admin']), (req, res) => {
  const db = load();
  const r = db.reports.find(x => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'Не найдено' });
  r.status = 'resolved';
  save(db);
  res.json({ ok: true });
});

app.delete('/api/admin/reports/:id', auth(['admin']), (req, res) => {
  const db = load();
  db.reports = db.reports.filter(x => x.id !== Number(req.params.id));
  save(db);
  res.json({ ok: true });
});

// ================= РЕЗЕРВНОЕ КОПИРОВАНИЕ =================

// Строгая проверка имени файла — защита от выхода за пределы папки backups (path traversal)
const BACKUP_FILENAME_RE = /^backup-[0-9TZ.-]+-(manual|auto|before-restore)\.json$/;

function backupFilenameNow(reason) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `backup-${stamp}-${reason}.json`;
}

function createBackupFile(reason) {
  const filename = backupFilenameNow(reason);
  fs.copyFileSync(DB_PATH, path.join(BACKUPS_DIR, filename));
  return filename;
}

function listBackupFiles() {
  return fs.readdirSync(BACKUPS_DIR)
    .filter(f => BACKUP_FILENAME_RE.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, f));
      return { filename: f, sizeBytes: stat.size, createdAt: stat.mtimeMs };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Проверка раз в час: не пора ли сделать автоматическую резервную копию по расписанию администратора
function checkScheduledBackup() {
  try {
    const db = load();
    const settings = db.backupSettings || { intervalDays: 7, lastBackupAt: null };
    const intervalMs = Math.max(1, Number(settings.intervalDays) || 7) * 24 * 60 * 60 * 1000;
    const due = !settings.lastBackupAt || Date.now() - settings.lastBackupAt >= intervalMs;
    if (due) {
      createBackupFile('auto');
      db.backupSettings.lastBackupAt = Date.now();
      save(db);
    }
  } catch (e) {
    console.error('Ошибка автоматического бэкапа:', e.message);
  }
}
setInterval(checkScheduledBackup, 60 * 60 * 1000); // проверяем раз в час
checkScheduledBackup(); // и сразу при старте сервера

app.get('/api/admin/backup/settings', auth(['admin']), (req, res) => {
  const db = load();
  const settings = db.backupSettings || { intervalDays: 7, lastBackupAt: null };
  const intervalMs = Math.max(1, Number(settings.intervalDays) || 7) * 24 * 60 * 60 * 1000;
  res.json({
    intervalDays: settings.intervalDays,
    lastBackupAt: settings.lastBackupAt,
    nextBackupAt: settings.lastBackupAt ? settings.lastBackupAt + intervalMs : null
  });
});

app.post('/api/admin/backup/settings', auth(['admin']), (req, res) => {
  const intervalDays = Number(req.body.intervalDays);
  if (!Number.isFinite(intervalDays) || intervalDays < 1 || intervalDays > 365) {
    return res.status(400).json({ error: 'Интервал должен быть от 1 до 365 дней' });
  }
  const db = load();
  db.backupSettings = db.backupSettings || {};
  db.backupSettings.intervalDays = Math.round(intervalDays);
  save(db);
  res.json({ ok: true });
});

app.get('/api/admin/backup/list', auth(['admin']), (req, res) => {
  res.json({ backups: listBackupFiles() });
});

app.post('/api/admin/backup/create', auth(['admin']), (req, res) => {
  const filename = createBackupFile('manual');
  const db = load();
  db.backupSettings = db.backupSettings || {};
  db.backupSettings.lastBackupAt = Date.now(); // ручной бэкап тоже сдвигает расписание автобэкапа
  save(db);
  res.json({ filename });
});

app.get('/api/admin/backup/download-current', auth(['admin']), (req, res) => {
  res.download(DB_PATH, `college-backup-${new Date().toISOString().slice(0, 10)}.json`);
});

app.get('/api/admin/backup/download/:filename', auth(['admin']), (req, res) => {
  const { filename } = req.params;
  if (!BACKUP_FILENAME_RE.test(filename)) return res.status(400).json({ error: 'Некорректное имя файла' });
  const filePath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден' });
  res.download(filePath, filename);
});

app.delete('/api/admin/backup/:filename', auth(['admin']), (req, res) => {
  const { filename } = req.params;
  if (!BACKUP_FILENAME_RE.test(filename)) return res.status(400).json({ error: 'Некорректное имя файла' });
  const filePath = path.join(BACKUPS_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});

// Восстановление из загруженного файла — принимает содержимое JSON текстом (клиент читает файл через FileReader)
app.post('/api/admin/backup/restore', auth(['admin']), (req, res) => {
  const { backupData } = req.body;
  if (!backupData || typeof backupData !== 'string') {
    return res.status(400).json({ error: 'Файл резервной копии не передан' });
  }
  let parsed;
  try {
    parsed = JSON.parse(backupData);
  } catch (e) {
    return res.status(400).json({ error: 'Файл повреждён или это не JSON' });
  }
  const requiredKeys = ['users', 'groups', 'chats', 'messages', 'assignments', 'submissions'];
  const missing = requiredKeys.filter(k => !Array.isArray(parsed[k]));
  if (missing.length) {
    return res.status(400).json({ error: `Файл не похож на резервную копию этого приложения (нет полей: ${missing.join(', ')})` });
  }

  // Сначала подстраховываемся — сохраняем текущее состояние на случай, если восстановление окажется ошибкой
  createBackupFile('before-restore');

  fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
  res.json({ ok: true, usersRestored: parsed.users.length });
});

// ================= АДМИН-ПАНЕЛЬ =================

app.get('/api/admin/users', auth(['admin']), (req, res) => {
  const db = load();
  res.json({ users: db.users.map(publicUser) });
});

app.post('/api/admin/teachers', auth(['admin']), (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  const db = load();
  if (db.users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Такой логин уже занят' });
  }
  const id = nextId(db.users);
  const user = {
    id, username, passwordHash: bcrypt.hashSync(password, 8),
    role: 'teacher', fullName, groupId: null, xp: 0, level: 1,
    bio: '', createdAt: Date.now()
  };
  db.users.push(user);
  save(db);
  res.json({ user: publicUser(user) });
});

app.delete('/api/admin/users/:id', auth(['admin']), (req, res) => {
  const db = load();
  const id = Number(req.params.id);
  const target = db.users.find(u => u.id === id);
  if (!target) return res.status(404).json({ error: 'Не найден' });
  if (target.role === 'admin') return res.status(400).json({ error: 'Нельзя удалить администратора' });
  db.users = db.users.filter(u => u.id !== id);
  save(db);
  res.json({ ok: true });
});

// Изменение роли пользователя — в т.ч. выдача прав администратора любому пользователю (студенту или преподавателю)
app.post('/api/admin/users/:id/role', auth(['admin']), (req, res) => {
  const { role, groupId } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Некорректная роль' });
  }
  const db = load();
  const target = db.users.find(u => u.id === Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
  if (target.id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя изменить свою собственную роль' });
  }
  if (role === 'student') {
    const gId = Number(groupId);
    if (!gId || !db.groups.some(g => g.id === gId)) {
      return res.status(400).json({ error: 'Для роли «студент» укажите существующую группу' });
    }
    target.groupId = gId;
  } else {
    target.groupId = null;
  }
  target.role = role;
  save(db);
  res.json({ user: publicUser(target) });
});

// Рейтинг студентов — по уровню/XP и по количеству выполненных заданий
app.get('/api/leaderboard', auth(), (req, res) => {
  const db = load();
  const students = db.users.filter(u => u.role === 'student');

  const byLevel = [...students]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 20)
    .map((u, i) => ({
      rank: i + 1, id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl, avatarColor: u.avatarColor || 'orange',
      level: u.level, xp: u.xp
    }));

  const completedCounts = {};
  db.submissions.forEach(s => {
    if (s.status === 'graded') completedCounts[s.studentId] = (completedCounts[s.studentId] || 0) + 1;
  });
  const byAssignments = students
    .map(u => ({ u, count: completedCounts[u.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map((x, i) => ({
      rank: i + 1, id: x.u.id, fullName: x.u.fullName, avatarUrl: x.u.avatarUrl, avatarColor: x.u.avatarColor || 'orange',
      completedCount: x.count
    }));

  res.json({ byLevel, byAssignments, myId: req.user.id });
});

// ================= ДОСТИЖЕНИЯ =================
// Достижения не хранятся отдельно — статус вычисляется на лету по фактическим данным пользователя,
// так они никогда не могут "рассинхронизироваться" с реальным прогрессом.

const ACHIEVEMENT_DEFS = [
  { id: 'first_assignment', title: 'Первые шаги', icon: '🎯', desc: 'Выполните первое задание', target: 1, metric: 'completedAssignments' },
  { id: 'assignments_5', title: 'Втянулся', icon: '📚', desc: 'Выполните 5 заданий', target: 5, metric: 'completedAssignments' },
  { id: 'assignments_10', title: 'Отличник', icon: '🏅', desc: 'Выполните 10 заданий', target: 10, metric: 'completedAssignments' },
  { id: 'assignments_25', title: 'Легенда учёбы', icon: '👑', desc: 'Выполните 25 заданий', target: 25, metric: 'completedAssignments' },
  { id: 'perfect_test', title: 'Знаток', icon: '💯', desc: 'Сдайте тест на 100%', target: 1, metric: 'perfectTests' },
  { id: 'ar_first', title: 'Исследователь', icon: '📍', desc: 'Найдите первую точку интереса', target: 1, metric: 'arCompletions' },
  { id: 'ar_5', title: 'Следопыт', icon: '🧭', desc: 'Найдите 5 точек интереса', target: 5, metric: 'arCompletions' },
  { id: 'level_5', title: 'Растущая звезда', icon: '⭐', desc: 'Достигните 5 уровня', target: 5, metric: 'level' },
  { id: 'level_10', title: 'Ветеран', icon: '🌟', desc: 'Достигните 10 уровня', target: 10, metric: 'level' },
  { id: 'posts_3', title: 'Автор', icon: '✍️', desc: 'Опубликуйте 3 поста в профиле', target: 3, metric: 'posts' },
  { id: 'shop_first', title: 'Покупатель', icon: '🛍', desc: 'Совершите первую покупку в магазине', target: 1, metric: 'purchases' }
];

app.get('/api/achievements', auth(), (req, res) => {
  const db = load();
  const uid = req.user.id;

  const mySubs = db.submissions.filter(s => s.studentId === uid && s.status === 'graded');
  const completedAssignments = mySubs.length;
  const perfectTests = mySubs.filter(s => s.autoScore === 100).length;
  const arAssignmentIds = new Set(db.assignments.filter(a => a.type === 'ar').map(a => a.id));
  const arCompletions = mySubs.filter(s => arAssignmentIds.has(s.assignmentId)).length;
  const posts = db.posts.filter(p => p.authorId === uid).length;
  const purchases = db.purchases.filter(p => p.userId === uid).length;
  const level = req.user.level;

  const metrics = { completedAssignments, perfectTests, arCompletions, posts, purchases, level };

  const achievements = ACHIEVEMENT_DEFS.map(def => {
    const progress = metrics[def.metric] || 0;
    return {
      id: def.id, title: def.title, icon: def.icon, desc: def.desc,
      target: def.target, progress: Math.min(progress, def.target),
      unlocked: progress >= def.target
    };
  });

  res.json({ achievements, unlockedCount: achievements.filter(a => a.unlocked).length, totalCount: achievements.length });
});

// Общая статистика для админ-панели: онлайн, посещения, объёмы данных
app.get('/api/admin/stats', auth(['admin']), (req, res) => {
  const db = load();
  const students = db.users.filter(u => u.role === 'student');
  const teachers = db.users.filter(u => u.role === 'teacher');
  const admins = db.users.filter(u => u.role === 'admin');
  const isOnline = (u) => !!(u.lastActiveAt && Date.now() - u.lastActiveAt < ONLINE_THRESHOLD_MS);

  const today = todayStr();
  const visitsToday = db.visits.filter(v => v.date === today).length;
  const visitsLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    visitsLast7Days.push({ date: d, count: db.visits.filter(v => v.date === d).length });
  }

  const arAssignmentIds = new Set(db.assignments.filter(a => a.type === 'ar').map(a => a.id));

  res.json({
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalAdmins: admins.length,
    totalGroups: db.groups.length,
    onlineStudents: students.filter(isOnline).length,
    onlineTeachers: teachers.filter(isOnline).length,
    onlineTotal: db.users.filter(isOnline).length,
    visitsToday,
    visitsLast7Days,
    totalAssignments: db.assignments.length,
    totalPosts: db.posts.length,
    totalOrders: db.purchases.length,
    totalArCompletions: db.submissions.filter(s => s.status === 'graded' && arAssignmentIds.has(s.assignmentId)).length
  });
});

app.post('/api/admin/groups', auth(['admin']), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название группы' });
  const db = load();
  const id = nextId(db.groups);
  const group = { id, name };
  db.groups.push(group);
  // Автоматически создаём групповой чат учебной группы
  const chatId = nextId(db.chats);
  db.chats.push({ id: chatId, name: `Чат группы ${name}`, groupId: id, type: 'class', members: null, reads: {} });
  save(db);
  res.json({ group });
});

app.delete('/api/admin/groups/:id', auth(['admin']), (req, res) => {
  const id = Number(req.params.id);
  const db = load();
  const groupIdx = db.groups.findIndex(g => g.id === id);
  if (groupIdx === -1) return res.status(404).json({ error: 'Группа не найдена' });
  db.groups.splice(groupIdx, 1);
  db.users.forEach(u => {
    if (u.groupId === id) u.groupId = null;
  });
  db.chats = db.chats.filter(c => !(c.type === 'class' && c.groupId === id));
  save(db);
  res.json({ ok: true });
});

app.post('/api/admin/chats', auth(['admin']), (req, res) => {
  const { name, groupId } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название чата' });
  const db = load();
  const chat = { id: nextId(db.chats), name, groupId: groupId ? Number(groupId) : null, type: groupId ? 'class' : 'general', members: null, reads: {} };
  db.chats.push(chat);
  save(db);
  res.json({ chat });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
