// lib/cart.js — корзина покупателя. Хранится в браузере (localStorage), на сервер уходит только при оформлении заказа.
// Элемент корзины: { id: id товара, size: выбранный размер }. Каждая вещь — в единственном экземпляре, поэтому количества нет.
import { useSyncExternalStore } from 'react';

const KEY = 'd12cart';
const EMPTY = [];
let raw = '';
let cache = EMPTY;
const subs = new Set();
const emit = () => subs.forEach((f) => f());
if (typeof window !== 'undefined') window.addEventListener('storage', emit); // синхронизация между вкладками

function read() {
  try {
    const s = localStorage.getItem(KEY) || '[]';
    if (s !== raw) { raw = s; cache = JSON.parse(s); }
    return cache;
  } catch { return EMPTY; }
}
function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* приватный режим */ }
  emit();
}

// Хук: список товаров в корзине, обновляется сам
export function useCart() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, read, () => EMPTY);
}
export const addToCart = (id, size) => write([...read().filter((x) => x.id !== id), { id, size: size || '' }]);
export const removeFromCart = (id) => write(read().filter((x) => x.id !== id));
export const clearCart = () => write([]);
