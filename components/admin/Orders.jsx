'use client';
// Вкладка «Заказы»: новые заявки покупателей, смена статуса.
// Статус меняется функцией set_order_status: «Выполнен» помечает вещи проданными (они попадают в график доходов),
// «Отменён» возвращает вещи в продажу, остальные статусы держат вещи в резерве.
import { useCallback, useEffect, useState } from 'react';
import { sb, fmt, imgSrc, refreshSite } from './adminLib';

const ST = { new: 'Новый', confirmed: 'Подтверждён', shipped: 'Отправлен', done: 'Выполнен', cancelled: 'Отменён' };
const DEL = { nova_poshta: 'Новая почта', ukrposhta: 'Укрпочта', pickup: 'Самовывоз' };

export default function Orders({ reload, say }) {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');
  const [flt, setFlt] = useState('active');

  const load = useCallback(async () => {
    const r = await sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (r.error) { setErr(r.error.message); setOrders([]); return; }
    setErr(''); setOrders(r.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (o, s) => {
    const r = await sb.rpc('set_order_status', { p_id: o.id, p_status: s });
    if (r.error) return say('Ошибка: ' + r.error.message);
    say(`Заказ №${o.number}: ${ST[s]}`);
    await load(); reload(); refreshSite();
  };
  const del = async (o) => {
    if (!confirm(`Удалить заказ №${o.number} из списка? Вещи вернутся в продажу, если заказ не выполнен.`)) return;
    if (o.status !== 'done') await sb.rpc('set_order_status', { p_id: o.id, p_status: 'cancelled' });
    await sb.from('orders').delete().eq('id', o.id);
    await load(); reload(); refreshSite();
  };

  const list = (orders || []).filter((o) => flt === 'all' || (flt === 'active' ? ['new', 'confirmed', 'shipped'].includes(o.status) : o.status === flt));
  const count = (s) => (orders || []).filter((o) => o.status === s).length;

  return (
    <>
      <h1>Заказы</h1>
      <p className="adm-sub">Заказы покупателей с сайта. Вещь в заказе автоматически резервируется.</p>
      {err && <div className="adm-warn">Не удалось получить заказы ({err}). Выполните файл <b>supabase/migration-orders.sql</b> в Supabase → SQL Editor.</div>}
      <div className="adm-seg">
        {[['active', `В работе (${count('new') + count('confirmed') + count('shipped')})`], ['new', `Новые (${count('new')})`], ['done', 'Выполненные'], ['cancelled', 'Отменённые'], ['all', 'Все']].map(([k, n]) => (
          <button key={k} className={flt === k ? 'on' : ''} onClick={() => setFlt(k)}>{n}</button>
        ))}
      </div>
      {list.map((o) => (
        <div className="adm-card" key={o.id}>
          <h2>№{o.number} · {fmt(o.total)} грн <span className="adm-tag">{ST[o.status]}</span></h2>
          <p style={{ margin: '0 0 10px' }}>
            {new Date(o.created_at).toLocaleString('ru-RU')} · <b>{o.name}</b> · <a href={`tel:${o.phone}`}>{o.phone}</a><br />
            {DEL[o.delivery] || o.delivery}{o.city ? `, ${o.city}` : ''}{o.address ? `, ${o.address}` : ''} · {o.payment === 'cod' ? 'при получении' : 'перевод на карту'}
            {o.comment && <><br /><i>«{o.comment}»</i></>}
          </p>
          {(o.order_items || []).map((i) => (
            <div className="adm-row" key={i.id}>
              {i.photo ? <img src={imgSrc(i.photo)} alt="" referrerPolicy="no-referrer" /> : <div className="ph" />}
              <div className="info"><b>{i.name}</b><br /><small>{i.size ? `размер ${i.size} · ` : ''}{fmt(i.price)} грн{i.cost != null ? ` (закупка ${fmt(i.cost)})` : ''}</small></div>
            </div>
          ))}
          <p style={{ marginBottom: 0 }}>
            {Object.keys(ST).filter((s) => s !== o.status).map((s) => (
              <button key={s} className={'abtn sm ' + (s === 'done' ? 'acc' : s === 'cancelled' ? 'red' : 'ghost')} style={{ marginRight: 6 }} onClick={() => setStatus(o, s)}>{ST[s]}</button>
            ))}
            <button className="abtn sm ghost" onClick={() => del(o)}>Удалить</button>
          </p>
        </div>
      ))}
      {orders && !list.length && !err && <p>Заказов нет.</p>}
    </>
  );
}
