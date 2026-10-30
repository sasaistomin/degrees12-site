// lib/utils.js — мелкие помощники: адреса (slug), картинки, цены
import { SITE_URL, CURRENCY } from './config';

// Транслитерация, чтобы адреса были латиницей: «Худи Archive» -> khudi-archive
const TR = { а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ё:'e',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'iu',я:'ia' };
export function slugify(s) {
  return String(s || '').toLowerCase().split('').map((c) => (c in TR ? TR[c] : c)).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
// Адрес товара: название-латиницей + id (id в конце — по нему находим товар)
export const productSlug = (p) => `${slugify(p.name) || 'item'}-${p.id}`;
export const idFromSlug = (slug) => String(slug).slice(-36);

// Путь к фото: старые товары хранят 'photos/x.png' -> '/photos/x.png'
export function imgSrc(u) {
  if (!u) return '';
  return /^(https?:)?\/\//.test(u) || u.startsWith('/') ? u : '/' + u;
}
export const absUrl = (u) => (!u ? '' : /^https?:/.test(u) ? u : SITE_URL + imgSrc(u));

// Цена с валютой: 7 500 грн
export function money(n, locale = 'ru') {
  return Number(n || 0).toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU') + ' ' + (CURRENCY[locale] || 'грн');
}
