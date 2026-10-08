/* ============================================================
   i18n.js — ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКОВ (RU / UA / EN)
   Все тексты сайта на трёх языках лежат здесь.
   Как работает: в index.html у текста стоит data-i18n="ключ",
   а этот файл подставляет перевод по ключу. Выбор запоминается в браузере.
   ============================================================ */

// Доступные языки (код — подпись на кнопке)
var LANGS = { ru: 'RU', uk: 'UA', en: 'EN' };

// ---------- ТЕКСТЫ ----------
// Чтобы поменять фразу — правьте её здесь, на нужном языке.
var T = {
  ru: {
    home: 'Главная', catalog: 'Каталог', categories: 'Категории', about: 'О нас',
    heroText: '<b>Archive Fashion.</b> Вещи с историей: винтажная и архивная одежда, отобранная вручную.',
    viewCatalog: 'Смотреть каталог', categoriesTitle: 'Категории', newArrivals: 'Новые поступления',
    catalogTitle: 'Каталог', sort: 'Сортировка', sortDefault: 'По умолчанию', sortDesc: 'Сначала дорогие', sortAsc: 'Сначала дешёвые',
    aboutTitle: 'О нас',
    aboutP1: 'Degrees° 12 — магазин архивной одежды. Мы собираем вещи прошлых коллекций и редкие винтажные находки, которые сегодня носятся так же хорошо, как и раньше.',
    aboutP2: 'Каждая вещь проходит проверку: состояние, швы, фурнитура, подлинность. В карточке мы честно указываем размер и износ.',
    goCatalog: 'Перейти в каталог', howTitle: 'Как мы работаем',
    f1: 'Только отобранные вещи, без масс-маркета', f2: 'Одна вещь — один размер, повторов нет', f3: 'Честное описание состояния', f4: 'Связь: @degrees12 (замените на свой контакт)',
    all: 'Все', size: 'размер', sold: 'Продано', pcs: 'шт.', empty: 'Пока пусто.'
  },
  uk: {
    home: 'Головна', catalog: 'Каталог', categories: 'Категорії', about: 'Про нас',
    heroText: '<b>Archive Fashion.</b> Речі з історією: вінтажний та архівний одяг, відібраний вручну.',
    viewCatalog: 'Дивитися каталог', categoriesTitle: 'Категорії', newArrivals: 'Нові надходження',
    catalogTitle: 'Каталог', sort: 'Сортування', sortDefault: 'За замовчуванням', sortDesc: 'Спочатку дорогі', sortAsc: 'Спочатку дешеві',
    aboutTitle: 'Про нас',
    aboutP1: 'Degrees° 12 — магазин архівного одягу. Ми збираємо речі минулих колекцій та рідкісні вінтажні знахідки, які сьогодні носяться так само добре, як і раніше.',
    aboutP2: 'Кожна річ проходить перевірку: стан, шви, фурнітура, автентичність. У картці ми чесно вказуємо розмір та зношеність.',
    goCatalog: 'Перейти до каталогу', howTitle: 'Як ми працюємо',
    f1: 'Лише відібрані речі, без масмаркету', f2: 'Одна річ — один розмір, повторів немає', f3: 'Чесний опис стану', f4: 'Зв’язок: @degrees12 (замініть на свій контакт)',
    all: 'Усі', size: 'розмір', sold: 'Продано', pcs: 'шт.', empty: 'Поки порожньо.'
  },
  en: {
    home: 'Home', catalog: 'Catalog', categories: 'Categories', about: 'About us',
    heroText: '<b>Archive Fashion.</b> Pieces with history: vintage and archive clothing, hand-picked.',
    viewCatalog: 'View catalog', categoriesTitle: 'Categories', newArrivals: 'New arrivals',
    catalogTitle: 'Catalog', sort: 'Sort', sortDefault: 'Default', sortDesc: 'Price: high to low', sortAsc: 'Price: low to high',
    aboutTitle: 'About us',
    aboutP1: 'Degrees° 12 is an archive fashion store. We collect pieces from past collections and rare vintage finds that wear as well today as they ever did.',
    aboutP2: 'Every item is checked: condition, seams, hardware, authenticity. In each listing we honestly state the size and wear.',
    goCatalog: 'Go to catalog', howTitle: 'How we work',
    f1: 'Only selected pieces, no mass market', f2: 'One item — one size, no restocks', f3: 'Honest condition notes', f4: 'Contact: @degrees12 (replace with your own)',
    all: 'All', size: 'size', sold: 'Sold', pcs: 'pcs', empty: 'Nothing here yet.'
  }
};

// Названия категорий (ключ — русское название, как в базе).
// Новая категория, которой здесь нет, показывается как вы её назвали.
var CAT_T = {
  uk: { 'Куртки': 'Куртки', 'Худи и свитшоты': 'Худі та світшоти', 'Футболки': 'Футболки', 'Брюки и джинсы': 'Штани та джинси', 'Аксессуары': 'Аксесуари', 'Обувь': 'Взуття' },
  en: { 'Куртки': 'Jackets', 'Худи и свитшоты': 'Hoodies & sweatshirts', 'Футболки': 'T-shirts', 'Брюки и джинсы': 'Pants & jeans', 'Аксессуары': 'Accessories', 'Обувь': 'Shoes' }
};

// ---------- ЛОГИКА ----------
// Текущий язык: сохранённый выбор, иначе язык браузера, иначе русский
var lang = (function () {
  try { var s = localStorage.getItem('lang'); if (T[s]) return s; } catch (e) {}
  var b = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return T[b] ? b : 'ru';
})();

// Перевод по ключу
function t(key) { return (T[lang] && T[lang][key]) || T.ru[key] || key; }
// Название категории на текущем языке
function cn(name) { return (CAT_T[lang] && CAT_T[lang][name]) || name; }

// Подставить переводы во все элементы с data-i18n и обновить кнопки
function applyStatic() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function (el) { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
}

// Клик по кнопке языка: запомнить выбор и перерисовать сайт
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-lang]');
  if (!b || !T[b.dataset.lang]) return;
  lang = b.dataset.lang;
  try { localStorage.setItem('lang', lang); } catch (err) {}
  applyStatic();
  if (typeof rerender === 'function') rerender(); // функция из script.js
});
