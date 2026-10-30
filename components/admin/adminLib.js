// Общие помощники админки: подключение к базе, логин -> почта, форматирование, обновление сайта
import { browserClient } from '@/lib/supabase';

export const sb = browserClient();
// Логин «Istomin Sasha M» -> istomin.sasha.m@degrees12.shop (внутренний адрес для Supabase)
export const toEmail = (login) => login.trim().toLowerCase().replace(/\s+/g, '.') + '@degrees12.shop';
export const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU');
export const imgSrc = (u) => (!u ? '' : /^(https?:)?\/\//.test(u) || u.startsWith('/') ? u : '/' + u);
export const token = async () => (await sb.auth.getSession()).data.session?.access_token || '';

// После изменений просим сайт сразу обновить страницы (иначе обновится в течение минуты)
export async function refreshSite() {
  try { await fetch('/api/revalidate', { method: 'POST', headers: { authorization: 'Bearer ' + (await token()) } }); } catch { /* не критично */ }
}
