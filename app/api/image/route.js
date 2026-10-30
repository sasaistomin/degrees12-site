// app/api/image/route.js — отдаёт админу картинку из чужого магазина (для удаления фона и сохранения у себя)
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, ADMIN_EMAIL } from '@/lib/config';
import { fetchImage } from '@/lib/extract';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data, error } = await createClient(SUPABASE_URL, SUPABASE_KEY).auth.getUser(token);
  if (error || data?.user?.email !== ADMIN_EMAIL) return Response.json({ error: 'forbidden' }, { status: 403 });
  try {
    const { url } = await req.json();
    const { buf, type } = await fetchImage(url);
    return new Response(buf, { headers: { 'content-type': type, 'cache-control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e.message || 'Ошибка' }, { status: 400 });
  }
}
