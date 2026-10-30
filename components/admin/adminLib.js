// Общие помощники админки: подключение к базе, логин -> почта, форматирование, обновление сайта
import { browserClient } from '@/lib/supabase';

export const sb = browserClient();
// Логин «Istomin Sasha M» -> istomin.sasha.m@degrees12.shop (внутренний адрес для Supabase)
export const toEmail = (login) => login.trim().toLowerCase().replace(/\s+/g, '.') + '@degrees12.shop';
// Список фото товара: новое поле photos, а у старых товаров — одно фото из photo
export const photoList = (p) => (p.photos?.length ? p.photos : p.photo ? [p.photo] : []);
export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU');
export const imgSrc = (u) => (!u ? '' : /^(https?:)?\/\//.test(u) || u.startsWith('/') ? u : '/' + u);
export const token = async () => (await sb.auth.getSession()).data.session?.access_token || '';

// После изменений просим сайт сразу обновить страницы (иначе обновится в течение минуты)
export async function refreshSite() {
  try { await fetch('/api/revalidate', { method: 'POST', headers: { authorization: 'Bearer ' + (await token()) } }); } catch { /* не критично */ }
}

// ============================================================
// Фото: уменьшение, удаление фона, загрузка в хранилище Supabase
// ============================================================
// Уменьшает до max px. По умолчанию PNG остаётся PNG, остальное — JPEG; forcePng — всегда PNG
export async function resize(file, max = 1200, forcePng = false) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  const png = forcePng || file.type === 'image/png';
  return new Promise((r) => cv.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.88));
}
// Кладёт файл в бакет photos и возвращает публичную ссылку
export async function uploadBlob(blob) {
  const ext = blob.type === 'image/png' ? '.png' : '.jpg';
  const name = Date.now() + '-' + Math.random().toString(36).slice(2, 7) + ext;
  const up = await sb.storage.from('photos').upload(name, blob, { contentType: blob.type });
  if (up.error) throw up.error;
  return sb.storage.from('photos').getPublicUrl(name).data.publicUrl;
}
// Удаление фона нейросетью @imgly/background-removal. Работает в браузере, библиотека подгружается с CDN только при первом использовании
// (модель ~40 МБ скачивается один раз и кешируется браузером).
let bgLib;
export async function removeBg(blob) {
  if (!bgLib) bgLib = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1/+esm');
  const fn = bgLib.removeBackground || bgLib.default?.removeBackground || bgLib.default;
  return fn(blob, { output: { format: 'image/png' } });
}
// Достаёт картинку по ссылке: свою и из хранилища — напрямую, чужую — через наш сервер (/api/image)
export async function getImageBlob(u) {
  const own = !/^https?:/.test(u) || u.startsWith(location.origin) || u.includes('.supabase.co/');
  if (own) { const r = await fetch(imgSrc(u)); if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); }
  const r = await fetch('/api/image', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await token()) }, body: JSON.stringify({ url: u }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP ' + r.status);
  return r.blob();
}
// Фото по ссылке -> без фона -> сохранено у вас; возвращает новую ссылку
export async function cutout(u) {
  const small = await resize(await getImageBlob(u), 1200, true);
  return uploadBlob(await removeBg(small));
}
