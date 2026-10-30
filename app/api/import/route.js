// app/api/import/route.js — «Поиск товаров»: принимает ссылки магазинов, возвращает найденные товары.
// Доступно только админу: проверяем токен входа (Authorization: Bearer ...) и почту.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, ADMIN_EMAIL } from '@/lib/config';
import { extract } from '@/lib/extract';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data, error } = await createClient(SUPABASE_URL, SUPABASE_KEY).auth.getUser(token);
  if (error || data?.user?.email !== ADMIN_EMAIL) return Response.json({ error: 'forbidden' }, { status: 403 });

  const { urls = [] } = await req.json().catch(() => ({}));
  const items = [], errors = [];
  for (const u of urls.slice(0, 5)) {
    try { items.push(...(await extract(u.trim()))); }
    catch (e) { errors.push({ url: u, error: e.message || 'Ошибка' }); }
  }
  return Response.json({ items, errors });
}
