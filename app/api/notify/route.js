// app/api/notify/route.js — уведомление владельцу в Telegram о новом заказе.
// Работает, только если в Vercel заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID (иначе просто пропускается).
// Данные заказа выдаёт база по секретному коду, который есть только у оформившего заказ: чужой запрос ничего не получит.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/config';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const DELIVERY = { nova_poshta: 'Новая почта', ukrposhta: 'Укрпочта', pickup: 'Самовывоз' };

export async function POST(req) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return Response.json({ skipped: true });
  const { id, secret } = await req.json().catch(() => ({}));
  if (!UUID.test(id || '') || !UUID.test(secret || '')) return Response.json({ error: 'bad' }, { status: 400 });

  const { data: o } = await createClient(SUPABASE_URL, SUPABASE_KEY).rpc('order_for_notify', { p_id: id, p_secret: secret });
  if (!o) return Response.json({ ok: true });

  const items = (o.items || []).map((i) => `• ${esc(i.name)}${i.size ? ' (' + esc(i.size) + ')' : ''} — ${esc(i.price)} грн`).join('\n');
  const text = [
    `🛍 <b>Новый заказ №${o.number}</b> — ${esc(o.total)} грн`, '', items, '',
    `👤 ${esc(o.name)}`, `📞 ${esc(o.phone)}`,
    `🚚 ${DELIVERY[o.delivery] || esc(o.delivery)}${o.city ? ', ' + esc(o.city) : ''}${o.address ? ', ' + esc(o.address) : ''}`,
    `💳 ${o.payment === 'cod' ? 'При получении' : 'Перевод на карту'}`,
    o.comment ? `💬 ${esc(o.comment)}` : '',
  ].filter((x) => x !== '').join('\n');
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
  }).catch(() => {});
  return Response.json({ ok: true });
}
