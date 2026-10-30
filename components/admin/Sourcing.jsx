'use client';
// Вкладка 4: поиск товаров в других магазинах.
// Вставляете ссылки на товар / коллекцию / сайт магазина -> сервер достаёт название, бренд, цену и фото ->
// цена продажи = цена магазина × курс + наценка (по умолчанию 10%) -> выбранное добавляется СКРЫТЫМИ черновиками.
import { useState } from 'react';
import { sb, fmt, imgSrc, token } from './adminLib';

export default function Sourcing({ products, cats, reload, say }) {
  const [text, setText] = useState('');
  const [margin, setMargin] = useState('10');
  const [rate, setRate] = useState('1');
  const [items, setItems] = useState([]);
  const [errs, setErrs] = useState([]);
  const [busy, setBusy] = useState(false);

  // ---- статистика сверху: считаем по товарам, у которых есть ссылка на магазин ----
  const imported = products.filter((p) => p.source_url);
  const shops = new Set(imported.map((p) => p.source_store).filter(Boolean)).size;
  const gain = (p) => (p.cost != null ? Number(p.price) - Number(p.cost) : 0);
  const possible = imported.filter((p) => !p.sold).reduce((s, p) => s + gain(p), 0);
  const earned = imported.filter((p) => p.sold).reduce((s, p) => s + gain(p), 0);

  // Расчёт цены для найденного товара
  const calc = (i) => {
    const cost = Math.round((Number(i.costIn) || 0) * (Number(rate) || 1));
    const price = Math.round(cost * (1 + (Number(margin) || 0) / 100));
    return { cost, price, profit: price - cost };
  };
  const kept = (i) => (i.imgs || []).filter((x) => x.keep).map((x) => x.u);
  const patch = (idx, p) => setItems((a) => a.map((x, k) => (k === idx ? { ...x, ...p } : x)));

  const search = async () => {
    const urls = text.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!urls.length) return say('Вставьте хотя бы одну ссылку');
    setBusy(true);
    try {
      const r = await fetch('/api/import', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await token()) }, body: JSON.stringify({ urls }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
      const have = new Set(products.map((p) => p.source_url));
      setErrs(j.errors || []);
      setItems((j.items || []).map((i) => ({ ...i, costIn: i.cost ?? '', dup: have.has(i.url), sel: i.cost != null && !have.has(i.url), cat: cats[0]?.name || '', imgs: (i.images?.length ? i.images : i.image ? [i.image] : []).map((u, k) => ({ u, keep: k < 12 })) })));
      if (!(j.items || []).length) say('Ничего не найдено. Попробуйте ссылку на конкретный товар.');
    } catch (e) { say('Ошибка: ' + e.message); }
    setBusy(false);
  };

  const add = async () => {
    const chosen = items.filter((i) => i.sel);
    if (!chosen.length) return say('Отметьте товары галочками');
    const rows = chosen.map((i) => { const c = calc(i); return { name: i.name, brand: i.brand || null, category: i.cat, sizes: i.sizes || [], price: c.price, cost: c.cost, photo: kept(i)[0] || null, photos: kept(i), source_url: i.url, source_store: i.store, hidden: true }; });
    const r = await sb.from('products').insert(rows);
    if (r.error) return say('Ошибка: ' + r.error.message);
    say(`Добавлено: ${rows.length}. Они скрыты — проверьте и опубликуйте на вкладке «Товары».`);
    setItems((a) => a.filter((i) => !i.sel));
    reload();
  };
  const upd = async (p, v) => { await sb.from('products').update(v).eq('id', p.id); reload(); };
  const del = async (p) => { if (confirm(`Удалить «${p.name}»?`)) { await sb.from('products').delete().eq('id', p.id); reload(); } };

  const selProfit = items.filter((i) => i.sel).reduce((s, i) => s + calc(i).profit, 0);

  return (
    <>
      <h1>Поиск товаров</h1>
      <p className="adm-sub">Находит одежду в других магазинах и считает вашу цену с наценкой.</p>

      <div className="adm-stats">
        <div className="adm-stat dark"><small>Магазинов</small><b>{shops}</b></div>
        <div className="adm-stat dark"><small>Возможная прибыль</small><b>{fmt(possible)} грн</b></div>
        <div className="adm-stat"><small>Товаров из магазинов</small><b>{imported.length}</b></div>
        <div className="adm-stat"><small>Уже заработано на них</small><b>{fmt(earned)} грн</b></div>
      </div>

      <div className="adm-warn">Фото и описания в чужих магазинах защищены авторским правом, а многие сайты запрещают автоматический сбор данных. Пользуйтесь этим с магазинами-партнёрами или поставщиками, с которыми есть договорённость. Товары добавляются скрытыми — проверьте каждый перед публикацией.</div>

      <div className="adm-card">
        <h2>Что искать</h2>
        <label>Ссылки (по одной в строке, до 5): на товар, коллекцию или сайт магазина</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'https://shop.example.com/collections/hoodies\nhttps://shop.example.com/products/some-item'} />
        <div className="adm-grid2">
          <div><label>Наценка, %</label><input type="number" min="0" value={margin} onChange={(e) => setMargin(e.target.value)} /></div>
          <div><label>Курс к грн (если цена в другой валюте, например 41 для USD)</label><input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        </div>
        <p><button className="abtn acc" disabled={busy} onClick={search}>{busy ? 'Ищу…' : 'Найти товары'}</button></p>
        {errs.map((e) => <div className="adm-warn" key={e.url}>{e.url}: {e.error}</div>)}
      </div>

      {items.length > 0 && (
        <div className="adm-card">
          <h2>Найдено: {items.length}</h2>
          <p style={{ marginTop: 0 }}>
            <button className="abtn sm ghost" onClick={() => setItems((a) => a.map((i) => ({ ...i, sel: i.costIn !== '' && !i.dup })))}>Выбрать все</button>{' '}
            <button className="abtn sm ghost" onClick={() => setItems((a) => a.map((i) => ({ ...i, sel: false })))}>Снять выбор</button>
          </p>
          {items.map((i, idx) => {
            const c = calc(i);
            return (
              <div className="adm-cand" key={i.url}>
                <input type="checkbox" checked={i.sel} onChange={(e) => patch(idx, { sel: e.target.checked })} style={{ marginTop: 6 }} />
                <img src={kept(i)[0] || imgSrc('/logo.jpg')} alt="" referrerPolicy="no-referrer" />
                <div className="info">
                  <b>{i.name}</b>{i.dup && <span className="adm-tag">Уже добавлен</span>}<br />
                  <small>{i.brand || '—'} · <a href={i.url} target="_blank" rel="noopener noreferrer">{i.store} ↗</a>{i.sizes?.length ? ' · ' + i.sizes.join(', ') : ''}</small>
                  {i.imgs.length > 0 && (
                    <div className="adm-gal">
                      <div className="adm-galbar"><b>Фото: оставить {kept(i).length} из {i.imgs.length}</b>
                        <button className="abtn sm ghost" onClick={() => patch(idx, { imgs: i.imgs.map((x) => ({ ...x, keep: true })) })}>Оставить все</button>
                        <button className="abtn sm ghost" onClick={() => patch(idx, { imgs: i.imgs.map((x) => ({ ...x, keep: false })) })}>Убрать все</button>
                      </div>
                      <div className="adm-thumbs">{i.imgs.map((x, k) => (
                        <button type="button" key={x.u} className={'adm-th' + (x.keep ? ' on' : '')} title={x.keep ? 'Нажмите, чтобы убрать' : 'Нажмите, чтобы оставить'}
                          onClick={() => patch(idx, { imgs: i.imgs.map((y, n) => (n === k ? { ...y, keep: !y.keep } : y)) })}>
                          <img src={x.u} alt="" referrerPolicy="no-referrer" loading="lazy" /><i>{x.keep ? '✓' : '✕'}</i>{kept(i)[0] === x.u && <em>главное</em>}
                        </button>
                      ))}</div>
                    </div>
                  )}
                  <div className="nums">
                    <span>Цена магазина: <input style={{ width: 90 }} type="number" min="0" value={i.costIn} onChange={(e) => patch(idx, { costIn: e.target.value })} /></span>
                    <span>Себестоимость: <b>{fmt(c.cost)}</b></span>
                    <span>Ваша цена: <b>{fmt(c.price)} грн</b></span>
                    <span>Прибыль: <b>{fmt(c.profit)} грн</b></span>
                    <select style={{ width: 'auto' }} value={i.cat} onChange={(e) => patch(idx, { cat: e.target.value })}>{cats.map((k) => <option key={k.id}>{k.name}</option>)}</select>
                  </div>
                </div>
              </div>
            );
          })}
          <p><button className="abtn acc" onClick={add}>Добавить выбранные в черновики ({items.filter((i) => i.sel).length}) · прибыль {fmt(selProfit)} грн</button></p>
        </div>
      )}

      <div className="adm-card">
        <h2>Уже добавленные из магазинов ({imported.length})</h2>
        {imported.map((p) => (
          <div className="adm-row" key={p.id}>
            {p.photo ? <img src={imgSrc(p.photo)} alt="" referrerPolicy="no-referrer" /> : <div className="ph" />}
            <div className="info"><b>{p.name}</b>{p.hidden && <span className="adm-tag">Черновик</span>}{p.sold && <span className="adm-tag">Продано</span>}<br />
              <small>{p.source_store} · закупка {fmt(p.cost)} → цена {fmt(p.price)} грн · прибыль {fmt(gain(p))} · <a href={p.source_url} target="_blank" rel="noopener noreferrer">ссылка на магазин ↗</a></small></div>
            <div className="acts">
              <button className="abtn sm" onClick={() => upd(p, { hidden: !p.hidden })}>{p.hidden ? 'Опубликовать' : 'Скрыть'}</button>
              <button className="abtn sm red" onClick={() => del(p)}>Удалить</button>
            </div>
          </div>
        ))}
        {!imported.length && <p>Пока пусто. Найдите товары выше.</p>}
      </div>
    </>
  );
}
