/* ============================================================
   script.js — логика сайта (обычно его менять не нужно)
   Данные берутся из products.js: CATEGORIES, PRODUCTS, CURRENCY
   ============================================================ */

// Короткая запись для поиска элемента по id
var $ = function (id) { return document.getElementById(id); };

// Выбранная категория в каталоге ('Все' = без фильтра)
var current = 'Все';

// Выбранная сортировка: 'default' (как в products.js), 'desc' (дорогие первыми), 'asc' (дешёвые первыми)
var sortMode = 'default';

// Найти категорию по названию (нужно для цвета плитки)
function findCat(name) {
  return CATEGORIES.filter(function (c) { return c.name === name; })[0]
    || { color: '#4a3223', text: '#f6efe3' };
}

// HTML карточки одного товара
function card(p) {
  var c = findCat(p.category);
  // Если есть фото — показываем его, иначе цветную плитку с названием
  var pic = p.photo
    ? '<div class="ph"><img src="' + p.photo + '" alt="' + p.name + '" loading="lazy"></div>'
    : '<div class="ph" style="background:' + c.color + ';color:' + c.text + '">' + p.name + '</div>';
  // Пометка «Продано», если sold: true
  var badge = p.sold ? '<span class="badge">Продано</span>' : '';
  return '<article class="card' + (p.sold ? ' sold' : '') + '">' + badge + pic +
    '<div class="info"><h3>' + p.name + '</h3>' +
    '<div class="meta">' + p.category + ' · размер ' + p.size + '</div>' +
    '<div class="price">' + p.price.toLocaleString('ru-RU') + ' ' + CURRENCY + '</div></div></article>';
}

// HTML плитки категории (с количеством вещей, которые ещё не проданы)
function catTile(c) {
  var n = PRODUCTS.filter(function (p) { return p.category === c.name && !p.sold; }).length;
  return '<button class="cat" data-cat="' + c.name + '" style="background:' + c.color + ';color:' + c.text + '">' +
    '<span>' + n + ' шт.</span><strong>' + c.name + '</strong></button>';
}

// Рисуем каталог: кнопки-фильтры + список товаров выбранной категории
function renderList() {
  var names = ['Все'].concat(CATEGORIES.map(function (c) { return c.name; }));
  $('chips').innerHTML = names.map(function (n) {
    return '<button class="chip" aria-pressed="' + (n === current) + '" data-chip="' + n + '">' + n + '</button>';
  }).join('');
  // Берём товары нужной категории
  var items = PRODUCTS.filter(function (p) { return current === 'Все' || p.category === current; });
  // Сортируем по цене, если выбрано
  if (sortMode === 'asc')  items.sort(function (a, b) { return a.price - b.price; });
  if (sortMode === 'desc') items.sort(function (a, b) { return b.price - a.price; });
  $('list').innerHTML = items.map(card).join('');
}

// Заполняем главную и страницу категорий
$('homeCats').innerHTML = $('allCats').innerHTML = CATEGORIES.map(catTile).join('');
$('homeNew').innerHTML = PRODUCTS.slice(0, 4).map(card).join(''); // первые 4 товара = новинки

// Клики: по плитке категории (переход в каталог) и по кнопке-фильтру
document.addEventListener('click', function (e) {
  var tile = e.target.closest('[data-cat]');
  var chip = e.target.closest('[data-chip]');
  if (tile) { current = tile.dataset.cat; location.hash = 'catalog'; route(); }
  if (chip) { current = chip.dataset.chip; renderList(); }
});

// Смена сортировки в выпадающем списке
$('sort').addEventListener('change', function (e) { sortMode = e.target.value; renderList(); });

// Переключение страниц по адресу (#home, #catalog, #categories, #about)
function route() {
  var h = (location.hash || '#home').slice(1);
  if (!$(h)) h = 'home';
  // Показываем нужный раздел, остальные прячем
  document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('on', v.id === h); });
  // Подсвечиваем активный пункт меню
  document.querySelectorAll('nav a').forEach(function (l) {
    if (l.getAttribute('href') === '#' + h) l.setAttribute('aria-current', 'page');
    else l.removeAttribute('aria-current');
  });
  if (h === 'catalog') renderList();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
