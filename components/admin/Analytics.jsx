'use client';
// Вкладка 2: график доходов и график посетителей
import { useEffect, useState } from 'react';
import Chart from './Charts';
import { sb, fmt } from './adminLib';

const iso = (d) => d.toISOString().slice(0, 10);

export default function Analytics({ products }) {
  const [mode, setMode] = useState('month');   // доходы: 'month' (12 мес.) или 'day' (30 дней)
  const [days, setDays] = useState(30);        // посетители: 7 / 30 / 90 дней
  const [views, setViews] = useState(null);
  const [top, setTop] = useState([]);
  const [err, setErr] = useState('');

  // Посетители берём из базы (функции daily_views и top_pages из supabase/migration.sql)
  useEffect(() => {
    let off = false;
    (async () => {
      const a = await sb.rpc('daily_views', { days });
      const b = await sb.rpc('top_pages', { days });
      if (off) return;
      if (a.error) { setErr(a.error.message); setViews([]); return; }
      setErr(''); setViews(a.data || []); setTop(b.data || []);
    })();
    return () => { off = true; };
  }, [days]);

  // ---- доходы ----
  const sold = products.filter((p) => p.sold);
  const profitOf = (p) => (p.cost != null ? Number(p.price) - Number(p.cost) : 0);
  const keyOf = (p) => String(p.sold_at || p.created_at || '').slice(0, mode === 'month' ? 7 : 10);
  const now = new Date();
  const keys = [];
  for (let i = (mode === 'month' ? 11 : 29); i >= 0; i--) {
    const d = new Date(mode === 'month' ? Date.UTC(now.getFullYear(), now.getMonth() - i, 1) : now.getTime() - i * 864e5);
    keys.push(iso(d).slice(0, mode === 'month' ? 7 : 10));
  }
  const income = keys.map((k) => {
    const items = sold.filter((p) => keyOf(p) === k);
    return { label: mode === 'month' ? k.slice(5) + '.' + k.slice(2, 4) : k.slice(8) + '.' + k.slice(5, 7), v: [items.reduce((s, p) => s + Number(p.price), 0), items.reduce((s, p) => s + profitOf(p), 0)] };
  });
  const revenue = sold.reduce((s, p) => s + Number(p.price), 0);
  const profit = sold.reduce((s, p) => s + profitOf(p), 0);

  // ---- посетители ----
  const map = Object.fromEntries((views || []).map((r) => [String(r.day).slice(0, 10), r]));
  const vdays = Array.from({ length: days }, (_, i) => iso(new Date(Date.now() - (days - 1 - i) * 864e5)));
  const visits = vdays.map((d) => ({ label: d.slice(8) + '.' + d.slice(5, 7), v: [Number(map[d]?.views || 0), Number(map[d]?.visitors || 0)] }));
  const totalViews = visits.reduce((s, d) => s + d.v[0], 0);
  const totalVisitors = visits.reduce((s, d) => s + d.v[1], 0);

  return (
    <>
      <h1>Доходы и посетители</h1>
      <p className="adm-sub">Доход считается по проданным товарам, прибыль — цена минус себестоимость.</p>
      <div className="adm-stats">
        <div className="adm-stat dark"><small>Выручка (всего)</small><b>{fmt(revenue)} грн</b></div>
        <div className="adm-stat"><small>Прибыль (всего)</small><b>{fmt(profit)} грн</b></div>
        <div className="adm-stat"><small>Продано вещей</small><b>{sold.length}</b></div>
        <div className="adm-stat"><small>Средний чек</small><b>{fmt(sold.length ? revenue / sold.length : 0)} грн</b></div>
      </div>

      <div className="adm-card">
        <h2>График доходов</h2>
        <div className="adm-seg">
          <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')}>По месяцам</button>
          <button className={mode === 'day' ? 'on' : ''} onClick={() => setMode('day')}>По дням</button>
        </div>
        <Chart type="bar" data={income} series={[{ name: 'Выручка', color: '#1d120b' }, { name: 'Прибыль', color: '#b9824f' }]} />
        {!sold.length && <p style={{ color: '#6f5d4d' }}>Пока нет проданных товаров. Нажмите «Продано» у товара, и он появится здесь.</p>}
      </div>

      <div className="adm-card">
        <h2>Сколько людей зашло на сайт</h2>
        <div className="adm-seg">{[7, 30, 90].map((n) => <button key={n} className={days === n ? 'on' : ''} onClick={() => setDays(n)}>{n} дней</button>)}</div>
        {err && <div className="adm-warn">Не удалось получить статистику ({err}). Выполните файл <b>supabase/migration.sql</b> в Supabase → SQL Editor.</div>}
        <div className="adm-stats">
          <div className="adm-stat"><small>Просмотров страниц</small><b>{fmt(totalViews)}</b></div>
          <div className="adm-stat"><small>Посетителей (сумма по дням)</small><b>{fmt(totalVisitors)}</b></div>
        </div>
        <Chart type="line" data={visits} series={[{ name: 'Просмотры', color: '#b9824f' }, { name: 'Посетители', color: '#1d120b' }]} />
      </div>

      {top.length > 0 && (
        <div className="adm-card">
          <h2>Популярные страницы</h2>
          {top.map((r) => <div className="adm-row" key={r.path}><div className="info"><b>{r.path}</b></div><span>{fmt(r.views)}</span></div>)}
        </div>
      )}
    </>
  );
}
