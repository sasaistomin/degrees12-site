// ============================================================
// lib/extract.js — достаёт товары (название, бренд, цена, фото, ссылка) со страниц магазинов.
// Работает только на сервере. Способы, по порядку:
//  1) Shopify-магазины: публичные /products.json и /products/<товар>.json
//  2) Микроразметка JSON-LD (Product / ItemList), которую большинство магазинов даёт для Google
//  3) Open Graph мета-теги (og:title, og:image, product:price:amount)
// Магазины, где товары рисуются только скриптом в браузере или закрыты от ботов, не читаются.
// ============================================================
import dns from 'node:dns/promises';
import net from 'node:net';

const UA = 'Mozilla/5.0 (compatible; Degrees12Importer/1.0)';

// Защита: не даём ходить на внутренние адреса (localhost, 10.x, 192.168.x и т. п.)
function isPrivate(ip) {
  if (net.isIPv6(ip)) return /^(::1|::$|fc|fd|fe80)/i.test(ip);
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
async function safeUrl(u) {
  const url = new URL(u);
  if (!/^https?:$/.test(url.protocol)) throw new Error('Только ссылки http/https');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new Error('Адрес запрещён');
  const addrs = await dns.lookup(url.hostname, { all: true });
  if (addrs.some((a) => isPrivate(a.address))) throw new Error('Адрес запрещён');
  return url;
}
async function get(u, json = false) {
  const url = await safeUrl(u);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: json ? 'application/json' : 'text/html,*/*' }, signal: ctl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('Магазин ответил: HTTP ' + r.status);
    const txt = await r.text();
    if (txt.length > 3_000_000) throw new Error('Страница слишком большая');
    return json ? JSON.parse(txt) : txt;
  } finally { clearTimeout(timer); }
}

const host = (u) => new URL(u).hostname.replace(/^www\./, '');
const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
const abs = (u, base) => { try { return u ? new URL(u, base).href : ''; } catch { return ''; } };

// ---- Shopify ----
function fromShopify(p, origin) {
  const v = p.variants || [];
  const sizeOpt = (p.options || []).findIndex((o) => /size|размер|розмір/i.test(o.name || ''));
  const sizes = sizeOpt >= 0 ? [...new Set(v.map((x) => x['option' + (sizeOpt + 1)]).filter(Boolean))] : [];
  const prices = v.map((x) => num(x.price)).filter((x) => x);
  return {
    name: p.title, brand: p.vendor || '', cost: prices.length ? Math.min(...prices) : null, currency: '',
    image: p.images?.[0]?.src || p.image?.src || '', images: [...new Set([...(p.images || []).map((i) => i.src), p.image?.src].filter(Boolean))], url: `${origin}/products/${p.handle}`, store: host(origin), sizes,
  };
}
async function shopify(url) {
  try {
    const path = url.pathname.replace(/\/$/, '');
    if (/\/products\/[^/]+$/.test(path)) {
      const j = await get(url.origin + path + '.json', true);
      return j.product ? [fromShopify(j.product, url.origin)] : null;
    }
    const base = /\/collections\/[^/]+$/.test(path) ? url.origin + path : url.origin;
    const j = await get(base + '/products.json?limit=24', true);
    return (j.products || []).map((p) => fromShopify(p, url.origin));
  } catch { return null; }
}

// ---- JSON-LD и Open Graph ----
function ldBlocks(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) { try { out.push(JSON.parse(m[1].trim())); } catch { /* пропускаем битый блок */ } }
  return out;
}
function walk(n, out) {
  if (Array.isArray(n)) return n.forEach((x) => walk(x, out));
  if (n && typeof n === 'object') { out.push(n); Object.values(n).forEach((v) => v && typeof v === 'object' && walk(v, out)); }
}
const types = (n) => [].concat(n['@type'] || []);
function meta(html, prop) {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i').exec(html);
  return decode((a || b || [])[1] || '');
}
function fromLd(n, base) {
  const offer = [].concat(n.offers || [])[0] || {};
  const images = [...new Set([].concat(n.image || []).map((x) => abs(typeof x === 'string' ? x : x?.url, base)).filter(Boolean))];
  return {
    name: decode(n.name || ''), brand: decode(typeof n.brand === 'string' ? n.brand : n.brand?.name || ''),
    cost: num(offer.price ?? offer.lowPrice ?? offer.priceSpecification?.price), currency: offer.priceCurrency || '',
    image: images[0] || '', images, url: abs(n.url || offer.url, base) || base, store: host(base), sizes: [],
  };
}
// Все мета-теги с таким именем (у страницы может быть несколько og:image)
function metaAll(html, prop) {
  const out = [];
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'gi');
  let m;
  while ((m = re.exec(html))) out.push(decode(m[1]));
  return out;
}
// ---- Фото товара ----
// Мусор: значки магазинов приложений, соцсети, логотипы, иконки, баннеры
const JUNK = /google|apple|app-?store|play-?store|badge|qr[-_.]|social|facebook|instagram|twitter|youtube|tiktok|payment|visa|mastercard|paypal|banner|newsletter|promo|logo|icon|sprite|avatar|flag|pixel|tracking|placeholder|loader|spinner|favicon|download|\.svg|\.gif|^data:/i;
const JUNK_ALT = /завантаж|скача|app ?store|google ?play|download|logo|логотип|instagram|facebook/i;
const IMG_URL = /(?:https?:)?\/\/[^\s"'<>\\)]+?\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>\\)]*)?/gi;
const normHtml = (h) => h.replace(/\\u002F/gi, '/').replace(/\\\//g, '/'); // JSON хранит слэши как \/
const baseName = (u) => { try { return decodeURIComponent(new URL(u).pathname.split('/').pop()).toLowerCase(); } catch { return ''; } };
// Подсказка о размере картинки в адресе (…/cache/850/…, ?w=800, -800x…): из копий берём самую большую
const sizeHint = (u) => { const m = /\/cache\/(\d+)\//.exec(u) || /[?&](?:w|width)=(\d+)/i.exec(u) || /[-_](\d{3,4})x\d{0,4}\./.exec(u); return m ? +m[1] : 0; };
const famKey = (u) => { try { const x = new URL(u); return x.host + '/' + x.pathname.split('/').slice(1, 3).join('/'); } catch { return ''; } };
const sharedPrefix = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };

// Все картинки из ТОЙ ЖЕ папки магазина и с тем же началом имени файла, что и главное фото товара.
// Ищем по всему коду страницы, включая JSON внутри скриптов, где многие магазины прячут галерею.
function familyImages(html, base, seeds) {
  const text = normHtml(html);
  const fams = new Set(seeds.map(famKey));
  const names = seeds.map(baseName).filter(Boolean);
  const out = [];
  let m;
  IMG_URL.lastIndex = 0;
  while ((m = IMG_URL.exec(text)) && out.length < 400) {
    const u = abs(decode(m[0]), base);
    if (u && !JUNK.test(u) && fams.has(famKey(u)) && names.some((n) => sharedPrefix(n, baseName(u)) >= 6)) out.push(u);
  }
  return out;
}
// Запасной вариант, если у страницы нет фото в данных для Google: <img> без значков и логотипов
function pageImages(html, base) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 40) {
    const tag = m[0];
    if (JUNK_ALT.test(tag)) continue;
    const set = /(?:data-)?srcset=["']([^"']+)["']/i.exec(tag)?.[1];
    const cand = set ? set.split(',').map((s) => s.trim().split(/\s+/)[0]).pop()
      : (/data-(?:src|original|lazy-src)=["']([^"']+)["']/i.exec(tag) || /\ssrc=["']([^"']+)["']/i.exec(tag) || [])[1];
    if (!cand || JUNK.test(cand)) continue;
    const u = abs(decode(cand), base);
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
}
// У страницы один товар: собираем все его фото (порядок: сначала из данных магазина, потом найденные в коде)
function enrich(products, html, pageUrl) {
  if (products.length !== 1) return products;
  const p = products[0];
  const seeds = [...new Set((p.images || []).filter(Boolean))];
  let images;
  if (seeds.length) {
    const byName = new Map(seeds.map((u) => [baseName(u), u]));
    familyImages(html, pageUrl, seeds).forEach((u) => {
      const k = baseName(u), cur = byName.get(k);
      if (!cur || sizeHint(u) > sizeHint(cur)) byName.set(k, u);
    });
    images = [...byName.values()];
  } else images = pageImages(html, pageUrl);
  p.images = images.slice(0, 30);
  p.image = p.images[0] || p.image || '';
  return products;
}
function parsePage(html, pageUrl) {
  const nodes = [];
  ldBlocks(html).forEach((j) => walk(j, nodes));
  const products = nodes.filter((n) => types(n).includes('Product') && n.name).map((n) => fromLd(n, pageUrl));
  if (products.length) return { products: enrich(products, html, pageUrl) };
  const links = [];
  nodes.filter((n) => types(n).includes('ItemList')).forEach((l) => [].concat(l.itemListElement || []).forEach((e) => {
    const u = e.url || e.item?.url || (typeof e.item === 'string' ? e.item : '');
    if (u) links.push(abs(u, pageUrl));
  }));
  if (links.length) return { links };
  const name = meta(html, 'og:title');
  if (!name) return {};
  return { products: enrich([{
    name, brand: meta(html, 'product:brand'), cost: num(meta(html, 'product:price:amount') || meta(html, 'og:price:amount')),
    currency: meta(html, 'product:price:currency') || meta(html, 'og:price:currency'), image: abs(meta(html, 'og:image'), pageUrl),
    images: metaAll(html, 'og:image').map((u) => abs(u, pageUrl)),
    url: pageUrl, store: host(pageUrl), sizes: [],
  }], html, pageUrl) };
}
async function generic(url) {
  const r = parsePage(await get(url.href), url.href);
  if (r.products) return r.products.slice(0, 24);
  const out = [];
  const links = [...new Set(r.links || [])].slice(0, 12);
  for (let i = 0; i < links.length; i += 4) {
    const res = await Promise.allSettled(links.slice(i, i + 4).map(async (l) => parsePage(await get(l), l).products?.[0]));
    res.forEach((x) => x.status === 'fulfilled' && x.value && out.push(x.value));
  }
  return out;
}

// Главная функция: ссылка на товар, коллекцию или главную страницу магазина -> список товаров
export async function extract(link) {
  const url = await safeUrl(link);
  const items = (await shopify(url)) || [];
  const found = items.length ? items : await generic(url);
  const seen = new Set();
  return found.filter((p) => p.name && !seen.has(p.url) && seen.add(p.url));
}

// Скачивает картинку для админа (чтобы убрать фон и сохранить у себя). Прямой запрос из браузера блокируется чужим сайтом.
export async function fetchImage(link) {
  const url = await safeUrl(link);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, referer: url.origin + '/', accept: 'image/*' }, signal: ctl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('Магазин ответил: HTTP ' + r.status);
    const type = r.headers.get('content-type') || '';
    if (!type.startsWith('image/')) throw new Error('По ссылке не картинка');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4_000_000) throw new Error('Картинка больше 4 МБ');
    return { buf, type };
  } finally { clearTimeout(timer); }
}
