/* ============================================================
   products.js — ЗДЕСЬ ВЫ ДОБАВЛЯЕТЕ ТОВАРЫ И КАТЕГОРИИ
   Меняйте только этот файл, остальные трогать не нужно.
   ============================================================ */

// Валюта, которая показывается после цены
var CURRENCY = '₴';

// ---------- КАТЕГОРИИ ----------
// name  — название (должно совпадать с category у товаров)
// color — цвет плитки категории, text — цвет текста на ней
var CATEGORIES = [
  { name: 'Куртки',          color: '#4a3223', text: '#f6efe3' },
  { name: 'Худи и свитшоты', color: '#b8946a', text: '#24160e' },
  { name: 'Футболки',        color: '#e9dcc6', text: '#24160e' },
  { name: 'Брюки и джинсы',  color: '#6f4e37', text: '#f6efe3' },
  { name: 'Аксессуары',      color: '#24160e', text: '#e9dcc6' }
];

// ---------- ТОВАРЫ ----------
// Чтобы добавить вещь: скопируйте любую строку { ... }, вставьте В НАЧАЛО списка
// (первые 4 товара показываются на главной как «Новые поступления»)
// и поменяйте значения. Не забывайте запятую после каждой строки.
//
// name     — название
// category — категория (точно как в списке выше)
// size     — размер
// price    — цена, только число
// photo    — путь к фото, например 'photos/jacket1.jpg' (файл положите в папку photos).
//            Пустые кавычки '' = вместо фото будет цветная плитка
// sold     — true, если продано (товар станет серым с пометкой «Продано»), иначе false
var PRODUCTS = [
  { name: 'Кожаная куртка 90-х',  category: 'Куртки',          size: 'M',        price: 4200, photo: '', sold: false },
  { name: 'Вельветовый бомбер',   category: 'Куртки',          size: 'L',        price: 3100, photo: '', sold: false },
  { name: 'Стёганая куртка',      category: 'Куртки',          size: 'L',        price: 3600, photo: '', sold: false },
  { name: 'Худи Archive',         category: 'Худи и свитшоты', size: 'XL',       price: 1900, photo: '', sold: false },
  { name: 'Свитшот Vintage',      category: 'Худи и свитшоты', size: 'M',        price: 1500, photo: '', sold: false },
  { name: 'Флисовая кофта',       category: 'Худи и свитшоты', size: 'L',        price: 1700, photo: '', sold: false },
  { name: 'Maison Margiela Caution', category: 'Футболки',  size: ['S', 'M', 'L', 'XL'], price: 7500, photo: 'photos/Maison-Margiela-Caution.png', sold: false },
  { name: 'Maison Margiela «Hands»', category: 'Футболки',  size: ['S', 'M', 'L', 'XL'], price: 1200,  photo: 'photos/Maison-Margiela-Hands.png', sold: false },
  { name: 'Лонгслив Retro',       category: 'Футболки',        size: 'S',        price: 1100, photo: '', sold: false },
  { name: 'Джинсы Straight',      category: 'Брюки и джинсы',  size: '32',       price: 2300, photo: '', sold: false },
  { name: 'Карго Army',           category: 'Брюки и джинсы',  size: '34',       price: 2100, photo: '', sold: false },
  { name: 'Вельветовые брюки',    category: 'Брюки и джинсы',  size: '30',       price: 1800, photo: '', sold: false },
  { name: 'Кепка Wool',           category: 'Аксессуары',      size: 'One size', price: 700,  photo: '', sold: false },
  { name: 'Сумка Messenger',      category: 'Аксессуары',      size: 'One size', price: 1600, photo: '', sold: false }
];
