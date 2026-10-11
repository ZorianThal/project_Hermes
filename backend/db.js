const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function defaultData() {
  return {
    users: [],       // {id, username, passwordHash, role, fullName, groupId, xp, level, coins, bio, createdAt, avatarUrl, avatarColor, lastActiveAt}
    groups: [],       // {id, name} — учебные группы/курсы
    chats: [],        // {id, name, groupId|null, type, members: [userId]|null, reads: {userId: ts}, pinnedBy: [userId], hiddenBy: {userId: ts}}
    messages: [],      // {id, chatId, userId, text, mediaUrl, mediaType, forwardedFrom, createdAt}
    assignments: [],   // {id, title, description, type:'text'|'test'|'ar', assignedTo:{type,groupId,studentIds}, questions, authorId, xpReward, coinsReward, dueDate, createdAt}
    submissions: [],   // {id, assignmentId, studentId, text, answers, status, xpAwarded, coinsAwarded, grade, autoScore, createdAt, gradedAt}
    posts: [],         // {id, authorId, target: 'feed'|'profile', text, mediaUrl, mediaType, createdAt, likes: [userId,...]}
    stories: [],       // {id, authorId, text, mediaUrl, mediaType, createdAt, viewedBy: [userId,...]}
    reports: [],       // {id, reporterId, reportedUserId, reason, context, createdAt, status: 'open'|'resolved'}
    products: [],      // {id, name, description, imageUrl, priceCoins, active, createdAt}
    purchases: [],     // {id, userId, productId, priceCoins, productName, createdAt, status: 'ordered'|'fulfilled'}
    visits: [],        // {id, userId, date: 'YYYY-MM-DD', createdAt} — для статистики посещений
    backupSettings: { intervalDays: 7, lastBackupAt: null } // настройки автоматического резервного копирования
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save(defaultData());
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const data = JSON.parse(raw);
  // Миграция: добираем недостающие коллекции для баз, созданных до появления новых возможностей
  let changed = false;
  const defaults = defaultData();
  for (const key of Object.keys(defaults)) {
    if (Array.isArray(defaults[key])) {
      if (!Array.isArray(data[key])) { data[key] = defaults[key]; changed = true; }
    } else if (data[key] === undefined || data[key] === null || typeof data[key] !== 'object') {
      data[key] = defaults[key];
      changed = true;
    }
  }
  if (data.backupSettings) {
    if (data.backupSettings.intervalDays === undefined) { data.backupSettings.intervalDays = 7; changed = true; }
    if (data.backupSettings.lastBackupAt === undefined) { data.backupSettings.lastBackupAt = null; changed = true; }
  }
  // Точечная миграция полей внутри уже существующих записей
  for (const u of data.users) {
    if (u.bio === undefined) { u.bio = ''; changed = true; }
    if (u.createdAt === undefined) { u.createdAt = Date.now(); changed = true; }
    if (u.avatarUrl === undefined) { u.avatarUrl = null; changed = true; }
    if (u.avatarColor === undefined) { u.avatarColor = 'orange'; changed = true; }
    if (u.coins === undefined) { u.coins = 0; changed = true; }
    if (u.lastActiveAt === undefined) { u.lastActiveAt = null; changed = true; }
    if (u.unlockedColors === undefined || !Array.isArray(u.unlockedColors)) {
      u.unlockedColors = ['#FF4D1C']; // дефолтный Hermes Orange
      changed = true;
    }
    if (u.dailyStreak === undefined) {
      u.dailyStreak = { weekStart: null, claimedDays: [], lastClaimDate: null, isBroken: false };
      changed = true;
    }
    if (u.pet === undefined) {
      u.pet = {
        name: 'КИБЕР-СПУТНИК',
        petType: null,
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
      changed = true;
    }
  }
  for (const c of data.chats) {
    if (c.type === undefined) { c.type = c.groupId ? 'class' : 'general'; changed = true; }
    if (c.members === undefined) { c.members = null; changed = true; } // null = видимость считается по groupId/type (старые чаты)
    if (c.reads === undefined) { c.reads = {}; changed = true; }
    if (c.pinnedBy === undefined) { c.pinnedBy = []; changed = true; }
    if (c.hiddenBy === undefined) { c.hiddenBy = {}; changed = true; }
  }
  for (const a of data.assignments) {
    if (a.type === undefined) { a.type = 'text'; changed = true; }
    if (a.assignedTo === undefined) {
      a.assignedTo = { type: 'group', groupId: a.groupId, studentIds: [] };
      changed = true;
    }
    if (a.questions === undefined) { a.questions = []; changed = true; }
    if (a.coinsReward === undefined) { a.coinsReward = 0; changed = true; }
    if (a.imageUrl === undefined) { a.imageUrl = null; changed = true; }
  }
  for (const s of data.submissions) {
    if (s.coinsAwarded === undefined) { s.coinsAwarded = 0; changed = true; }
  }
  for (const p of data.products) {
    if (p.category === undefined) { p.category = 'merch'; changed = true; }
    if (p.colorHex === undefined) { p.colorHex = null; changed = true; }
    if (p.slot === undefined) { p.slot = null; changed = true; }
    if (p.icon === undefined) { p.icon = null; changed = true; }
  }

  // Сид стартовых стилей и предметов питомца в магазин, если их еще нет
  const hasStyles = data.products.some(p => p.category === 'style');
  if (!hasStyles) {
    const starterStyles = [
      { name: 'Toxic Emerald', colorHex: '#10B981', priceCoins: 100, description: 'Изумрудный био-неон химических лабораторий' },
      { name: 'Cyber Magenta', colorHex: '#F43F5E', priceCoins: 150, description: 'Неоновая фуксия ночного Найт-Сити' },
      { name: 'Glitch Cyan', colorHex: '#06B6D4', priceCoins: 150, description: 'Квантовый лазурный импульс и цифровой шум' },
      { name: 'Hyper Amber', colorHex: '#F59E0B', priceCoins: 200, description: 'Плазменный янтарный луч энергоядра' },
      { name: 'Ultra Violet', colorHex: '#8B5CF6', priceCoins: 250, description: 'Глубокая ультрафиолетовая сингулярность' },
      { name: 'Tokyo Sunset', colorHex: '#EC4899', priceCoins: 300, description: 'Неоновый градиентный закат мегаполиса' },
      { name: 'Solar Gold', colorHex: '#EAB308', priceCoins: 500, description: 'Имперское квантовое золото высшей пробы' }
    ];
    for (const s of starterStyles) {
      data.products.push({
        id: nextId(data.products),
        name: s.name,
        description: s.description,
        category: 'style',
        colorHex: s.colorHex,
        slot: null,
        icon: null,
        imageUrl: null,
        priceCoins: s.priceCoins,
        active: true,
        createdAt: Date.now()
      });
    }
    changed = true;
  }

  const hasPetItems = data.products.some(p => p.category === 'pet');
  if (!hasPetItems) {
    const starterPetItems = [
      // CAT
      { code: 'cat_head_common', name: 'Шлем Рыскателя', slot: 'head', rarity: 'common', petType: 'cat', setName: 'Рыскатель', priceCoins: 40, description: 'Облегченный титановый шлем с акустическими датчиками.' },
      { code: 'cat_body_common', name: 'Каркас Рыскателя', slot: 'body', rarity: 'common', petType: 'cat', setName: 'Рыскатель', priceCoins: 40, description: 'Композитная рама из прессованного углеволокна.' },
      { code: 'cat_limbs_common', name: 'Лапы Рыскателя', slot: 'limbs', rarity: 'common', petType: 'cat', setName: 'Рыскатель', priceCoins: 40, description: 'Гидравлические пружинные сервоприводы бега.' },
      { code: 'cat_head_rare', name: 'Визор Пантеры', slot: 'head', rarity: 'rare', petType: 'cat', setName: 'Кибер-Пантера', priceCoins: 100, description: 'Сенсорный визор со спектральным фильтром ночного видения.' },
      { code: 'cat_body_rare', name: 'Броня Пантеры', slot: 'body', rarity: 'rare', petType: 'cat', setName: 'Кибер-Пантера', priceCoins: 100, description: 'Бронепластины с антибликовым полимерным напылением.' },
      { code: 'cat_limbs_rare', name: 'Когти Пантеры', slot: 'limbs', rarity: 'rare', petType: 'cat', setName: 'Кибер-Пантера', priceCoins: 100, description: 'Усиленные конечности с магнитными демпферами.' },
      { code: 'cat_head_epic', name: 'Нейро-Шлем Призрака', slot: 'head', rarity: 'epic', petType: 'cat', setName: 'Нейро-Призрак', priceCoins: 220, description: 'Шлем прямого нейро-подключения с ионизированным гребнем.' },
      { code: 'cat_body_epic', name: 'Экзо-Панцирь Призрака', slot: 'body', rarity: 'epic', petType: 'cat', setName: 'Нейро-Призрак', priceCoins: 220, description: 'Фазовый генератор с активным подавителем теплового следа.' },
      { code: 'cat_limbs_epic', name: 'Стримеры Призрака', slot: 'limbs', rarity: 'epic', petType: 'cat', setName: 'Нейро-Призрак', priceCoins: 220, description: 'Антигравитационные лапы со встроенными микро-турбинами.' },
      { code: 'cat_head_legendary', name: 'Диадема Бастет', slot: 'head', rarity: 'legendary', petType: 'cat', setName: 'Солнечный Бастет', priceCoins: 450, description: 'Золоченая корона-излучатель протокола Древнего Солнца.' },
      { code: 'cat_body_legendary', name: 'Саркофаг Бастет', slot: 'body', rarity: 'legendary', petType: 'cat', setName: 'Солнечный Бастет', priceCoins: 450, description: 'Титано-золотой корпус со сверхпроводящим фотонным ядром.' },
      { code: 'cat_limbs_legendary', name: 'Опоры Бастет', slot: 'limbs', rarity: 'legendary', petType: 'cat', setName: 'Солнечный Бастет', priceCoins: 450, description: 'Плазменные серво-приводы абсолютного сцепления.' },

      // OWL
      { code: 'owl_head_common', name: 'Окуляр Планера', slot: 'head', rarity: 'common', petType: 'owl', setName: 'Планер', priceCoins: 40, description: 'Монокулярный оптический блок дальнего наблюдения.' },
      { code: 'owl_body_common', name: 'Фюзеляж Планера', slot: 'body', rarity: 'common', petType: 'owl', setName: 'Планер', priceCoins: 40, description: 'Аэродинамический стальной каркас с защитой узлов.' },
      { code: 'owl_limbs_common', name: 'Крылья Планера', slot: 'limbs', rarity: 'common', petType: 'owl', setName: 'Планер', priceCoins: 40, description: 'Складные дюралевые перья-пластины.' },
      { code: 'owl_head_rare', name: 'Тепловизор Ноктуа', slot: 'head', rarity: 'rare', petType: 'owl', setName: 'Ночной Сканер', priceCoins: 100, description: 'Бинокулярный тепловизионный поисковый модуль.' },
      { code: 'owl_body_rare', name: 'Шасси Ноктуа', slot: 'body', rarity: 'rare', petType: 'owl', setName: 'Ночной Сканер', priceCoins: 100, description: 'Экранированный кожух бортового вычислителя.' },
      { code: 'owl_limbs_rare', name: 'Крылья Ноктуа', slot: 'limbs', rarity: 'rare', petType: 'owl', setName: 'Ночной Сканер', priceCoins: 100, description: 'Углепластиковые закрылки с бесшумным профилем полета.' },
      { code: 'owl_head_epic', name: 'Визор Оракула', slot: 'head', rarity: 'epic', petType: 'owl', setName: 'Квантовый Оракул', priceCoins: 220, description: 'Панорамный голографический сенсор с фасеточными линзами.' },
      { code: 'owl_body_epic', name: 'Мантия Оракула', slot: 'body', rarity: 'epic', petType: 'owl', setName: 'Квантовый Оракул', priceCoins: 220, description: 'Энергетический плащ с квантовой дифракцией света.' },
      { code: 'owl_limbs_epic', name: 'Крылья Оракула', slot: 'limbs', rarity: 'epic', petType: 'owl', setName: 'Квантовый Оракул', priceCoins: 220, description: 'Фотонные резонансные плоскости парения.' },
      { code: 'owl_head_legendary', name: 'Венец Архитектора', slot: 'head', rarity: 'legendary', petType: 'owl', setName: 'Архитектор Эфира', priceCoins: 450, description: 'Хронометрический вычислительный купол высшего порядка.' },
      { code: 'owl_body_legendary', name: 'Сфера Архитектора', slot: 'body', rarity: 'legendary', petType: 'owl', setName: 'Архитектор Эфира', priceCoins: 450, description: 'Гравитационный конденсатор энергии нулевой точки.' },
      { code: 'owl_limbs_legendary', name: 'Крылья Архитектора', slot: 'limbs', rarity: 'legendary', petType: 'owl', setName: 'Архитектор Эфира', priceCoins: 450, description: 'Золотые солярные плоскости сверхзвукового планирования.' },

      // SNAKE
      { code: 'snake_head_common', name: 'Капсула Кольца', slot: 'head', rarity: 'common', petType: 'snake', setName: 'Нано-Кольца', priceCoins: 40, description: 'Обтекаемая сенсорная головная капсула.' },
      { code: 'snake_body_common', name: 'Сегменты Кольца', slot: 'body', rarity: 'common', petType: 'snake', setName: 'Нано-Кольца', priceCoins: 40, description: 'Цепь соединенных титановых колец-шарниров.' },
      { code: 'snake_limbs_common', name: 'Хвост Кольца', slot: 'limbs', rarity: 'common', petType: 'snake', setName: 'Нано-Кольца', priceCoins: 40, description: 'Магнитный стабилизатор курсовой устойчивости.' },
      { code: 'snake_head_rare', name: 'Капюшон Кобры', slot: 'head', rarity: 'rare', petType: 'snake', setName: 'Импульсная Кобра', priceCoins: 100, description: 'Развертываемые тепловые ребра радиаторного типа.' },
      { code: 'snake_body_rare', name: 'Хребет Кобры', slot: 'body', rarity: 'rare', petType: 'snake', setName: 'Импульсная Кобра', priceCoins: 100, description: 'Эластичный электромагнитный кабель в бронекожухе.' },
      { code: 'snake_limbs_rare', name: 'Жало Кобры', slot: 'limbs', rarity: 'rare', petType: 'snake', setName: 'Импульсная Кобра', priceCoins: 100, description: 'Импульсный разрядник высоковольтного статического поля.' },
      { code: 'snake_head_epic', name: 'Фокус Уробороса', slot: 'head', rarity: 'epic', petType: 'snake', setName: 'Сингулярный Уроборос', priceCoins: 220, description: 'Ионная линза искривления пространственных координат.' },
      { code: 'snake_body_epic', name: 'Спираль Уробороса', slot: 'body', rarity: 'epic', petType: 'snake', setName: 'Сингулярный Уроборос', priceCoins: 220, description: 'Бесконечный замкнутый волновод антиматерии.' },
      { code: 'snake_limbs_epic', name: 'Грави-Кольца Уробороса', slot: 'limbs', rarity: 'epic', petType: 'snake', setName: 'Сингулярный Уроборос', priceCoins: 220, description: 'Левитирующие орбитальные сегменты свободного вращения.' },
      { code: 'snake_head_legendary', name: 'Шлем Дракона', slot: 'head', rarity: 'legendary', petType: 'snake', setName: 'Дракон Пустоты', priceCoins: 450, description: 'Чешуйчатая титановая корона с рубиновым визором.' },
      { code: 'snake_body_legendary', name: 'Броня Дракона', slot: 'body', rarity: 'legendary', petType: 'snake', setName: 'Дракон Пустоты', priceCoins: 450, description: 'Золотой термоядерный экзоскелет высшего класса.' },
      { code: 'snake_limbs_legendary', name: 'Вектор Дракона', slot: 'limbs', rarity: 'legendary', petType: 'snake', setName: 'Дракон Пустоты', priceCoins: 450, description: 'Плазменные левитационные сопла гиперзвуковой тяги.' },

      // SPIDER
      { code: 'spider_head_common', name: 'Окуляры Карапакса', slot: 'head', rarity: 'common', petType: 'spider', setName: 'Карапакс', priceCoins: 40, description: 'Четырехточечный оптический кластер ближней зоны.' },
      { code: 'spider_body_common', name: 'Панцирь Карапакса', slot: 'body', rarity: 'common', petType: 'spider', setName: 'Карапакс', priceCoins: 40, description: 'Штампованный стальной панцирь с антикоррозийным слоем.' },
      { code: 'spider_limbs_common', name: 'Опоры Карапакса', slot: 'limbs', rarity: 'common', petType: 'spider', setName: 'Карапакс', priceCoins: 40, description: 'Четыре пары шарнирных механических стоек.' },
      { code: 'spider_head_rare', name: 'Спектрометр Ткача', slot: 'head', rarity: 'rare', petType: 'spider', setName: 'Теневой Ткач', priceCoins: 100, description: 'Восьмиточечный инфракрасный лазерный дальномер.' },
      { code: 'spider_body_rare', name: 'Абдомен Ткача', slot: 'body', rarity: 'rare', petType: 'spider', setName: 'Теневой Ткач', priceCoins: 100, description: 'Контейнер оптоволоконной полимерной нано-нити.' },
      { code: 'spider_limbs_rare', name: 'Лапы Ткача', slot: 'limbs', rarity: 'rare', petType: 'spider', setName: 'Теневой Ткач', priceCoins: 100, description: 'Углепластиковые тонкие спицы с вакуумными присосками.' },
      { code: 'spider_head_epic', name: 'Крио-Маска Тарантула', slot: 'head', rarity: 'epic', petType: 'spider', setName: 'Крио-Тарантул', priceCoins: 220, description: 'Хелицеры-манипуляторы с циркуляцией жидкого азота.' },
      { code: 'spider_body_epic', name: 'Реактор Тарантула', slot: 'body', rarity: 'epic', petType: 'spider', setName: 'Крио-Тарантул', priceCoins: 220, description: 'Теплообменник с неоновым контуром заморозки.' },
      { code: 'spider_limbs_epic', name: 'Лапы Тарантула', slot: 'limbs', rarity: 'epic', petType: 'spider', setName: 'Крио-Тарантул', priceCoins: 220, description: 'Массивные гидравлические стойки с грунтозацепами.' },
      { code: 'spider_head_legendary', name: 'Корона Нексуса', slot: 'head', rarity: 'legendary', petType: 'spider', setName: 'Владыка Нексуса', priceCoins: 450, description: 'Центральный процессор управления микро-роем.' },
      { code: 'spider_body_legendary', name: 'Ядро Нексуса', slot: 'body', rarity: 'legendary', petType: 'spider', setName: 'Владыка Нексуса', priceCoins: 450, description: 'Многогранный золотой генератор защитного барьера.' },
      { code: 'spider_limbs_legendary', name: 'Опоры Нексуса', slot: 'limbs', rarity: 'legendary', petType: 'spider', setName: 'Владыка Нексуса', priceCoins: 450, description: 'Титано-плазменные сочленения с микро-соплами.' }
    ];
    for (const item of starterPetItems) {
      data.products.push({
        id: nextId(data.products),
        code: item.code,
        name: item.name,
        description: item.description,
        category: 'pet',
        colorHex: null,
        slot: item.slot,
        rarity: item.rarity,
        petType: item.petType,
        setName: item.setName,
        icon: null,
        imageUrl: null,
        priceCoins: item.priceCoins,
        active: true,
        createdAt: Date.now()
      });
    }
    changed = true;
  }

  if (changed) save(data);
  return data;
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

module.exports = { load, save, nextId, DB_PATH };
