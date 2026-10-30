// app/api/revalidate/route.js — админка вызывает после изменений, чтобы сайт обновился сразу (а не через минуту)
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, ADMIN_EMAIL } from '@/lib/config';

export async function POST(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data, error } = await createClient(SUPABASE_URL, SUPABASE_KEY).auth.getUser(token);
  if (error || data?.user?.email !== ADMIN_EMAIL) return Response.json({ error: 'forbidden' }, { status: 403 });
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
