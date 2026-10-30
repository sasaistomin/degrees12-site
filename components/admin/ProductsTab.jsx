'use client';
// Вкладка 3: товары — добавить, изменить, «Продано», скрыть, удалить, загрузить фото, категории
import { useState } from 'react';
import { sb, fmt, imgSrc, photoList, refreshSite } from './adminLib';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const EMPTY = { id: null, name: '', brand: '', category: '', price: '', cost: '', sizes: [], extra: '', photos: [], description: '', source_url: '', source_store: '', hidden: false };

export default function ProductsTab({ products, cats, reload, say }) {
  const [f, setF] = useState(null);          // форма (null = закрыта)
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState('all');
  const [busy, setBusy] = useState(false);
  const [purl, setPurl] = useState('');
  const [cn, setCn] = useState(''); const [c1, setC1] = useState('#4a3223'); const [c2, setC2] = useState('#f6efe3');

  // После любого изменения: перезагрузить данные и обновить публичный сайт
  const done = async (msg) => { await reload(); refreshSite(); if (msg) say(msg); };
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const open = (p) => setF(p ? {
    ...EMPTY, ...p, price: p.price ?? '', cost: p.cost ?? '', brand: p.brand || '', photos: photoList(p), description: p.description || '',
    source_url: p.source_url || '', source_store: p.source_store || '',
    sizes: (p.sizes || []).filter((s) => SIZES.includes(s)), extra: (p.sizes || []).filter((s) => !SIZES.includes(s)).join(', '),
  } : { ...EMPTY, category: cats[0]?.name || '' });

  // Загрузка фото: уменьшаем до 1200 px и кладём в хранилище Supabase (PNG остаётся PNG — прозрачный фон сохраняется)
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const img = await createImageBitmap(file);
      const k = Math.min(1, 1200 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      const png = file.type === 'image/png';
      const blob = await new Promise((r) => cv.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.88));
      const name = Date.now() + '-' + Math.random().toString(36).slice(2, 7) + (png ? '.png' : '.jpg');
      const up = await sb.storage.from('photos').upload(name, blob, { contentType: blob.type });
      if (up.error) throw up.error;
      setF((x) => ({ ...x, photos: [...x.photos, sb.storage.from('photos').getPublicUrl(name).data.publicUrl] }));
      say('Фото загружено');
    } catch (e) { say('Ошибка фото: ' + e.message); }
    setBusy(false);
  };

  const save = async () => {
    if (!f.name.trim()) return say('Введите название');
    const sizes = [...f.sizes, ...f.extra.split(',').map((s) => s.trim()).filter(Boolean)];
    const row = {
      name: f.name.trim(), brand: f.brand.trim() || null, category: f.category, price: Number(f.price) || 0,
      cost: f.cost === '' ? null : Number(f.cost), sizes, photo: f.photos[0] || null, photos: f.photos, description: f.description.trim() || null,
      source_url: f.source_url || null, source_store: f.source_store || null, hidden: !!f.hidden,
    };
    const r = f.id ? await sb.from('products').update(row).eq('id', f.id) : await sb.from('products').insert(row);
    if (r.error) return say('Ошибка: ' + r.error.message);
    setF(null); done('Сохранено');
  };
  const upd = async (p, patch) => { const r = await sb.from('products').update(patch).eq('id', p.id); r.error ? say('Ошибка: ' + r.error.message) : done(); };
  const del = async (p) => { if (confirm(`Удалить «${p.name}» насовсем?`)) { await sb.from('products').delete().eq('id', p.id); done('Удалено'); } };
  const addCat = async () => {
    if (!cn.trim()) return say('Введите название категории');
    const r = await sb.from('categories').insert({ name: cn.trim(), color: c1, text_color: c2, position: cats.length + 1 });
    if (r.error) return say('Ошибка: ' + r.error.message);
    setCn(''); done('Категория добавлена');
  };
  const delCat = async (c) => { if (confirm(`Удалить категорию «${c.name}»? Товары останутся.`)) { await sb.from('categories').delete().eq('id', c.id); done(); } };

  const list = products.filter((p) =>
    (flt === 'all' || (flt === 'live' && !p.sold && !p.hidden) || (flt === 'sold' && p.sold) || (flt === 'hidden' && p.hidden)) &&
    (p.name + ' ' + (p.brand || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <h1>Товары</h1>
      <p className="adm-sub">Всего: {products.length}. Изменения сразу появляются на сайте.</p>
      <p><button className="abtn acc" onClick={() => open(null)}>+ Добавить товар</button></p>

      {f && (
        <div className="adm-card">
          <h2>{f.id ? 'Изменить товар' : 'Новый товар'}</h2>
          <div className="adm-grid2">
            <div className="full"><label>Название (модель)</label><input value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label>Бренд</label><input value={f.brand} onChange={(e) => set('brand', e.target.value)} /></div>
            <div><label>Категория</label><select value={f.category} onChange={(e) => set('category', e.target.value)}>{cats.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
            <div><label>Цена продажи, грн</label><input type="number" min="0" value={f.price} onChange={(e) => set('price', e.target.value)} /></div>
            <div><label>Себестоимость, грн (для расчёта прибыли)</label><input type="number" min="0" value={f.cost} onChange={(e) => set('cost', e.target.value)} /></div>
            <div className="full"><label>Размеры</label>
              <div className="adm-sizes">{SIZES.map((s) => (
                <label key={s}><input type="checkbox" checked={f.sizes.includes(s)} onChange={() => set('sizes', f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s])} />{s}</label>
              ))}</div>
              <input style={{ marginTop: 8 }} placeholder="Другие размеры через запятую, например: One size" value={f.extra} onChange={(e) => set('extra', e.target.value)} />
            </div>
            <div className="full"><label>Описание (для Google и покупателей)</label><textarea value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="full"><label>Фото: первое — главное. Нажмите ✕, чтобы убрать лишнее, ★ — сделать главным</label>
              <div className="adm-thumbs">{f.photos.map((u, k) => (
                <div className="adm-th on" key={u + k}>
                  <img src={imgSrc(u)} alt="" referrerPolicy="no-referrer" />
                  <button type="button" className="x" aria-label="Убрать" onClick={() => set('photos', f.photos.filter((_, n) => n !== k))}>✕</button>
                  {k === 0 ? <em>главное</em> : <button type="button" className="mk" aria-label="Сделать главным" onClick={() => set('photos', [u, ...f.photos.filter((_, n) => n !== k)])}>★</button>}
                </div>
              ))}</div>
              <input type="file" accept="image/*" multiple onChange={(e) => [...e.target.files].forEach((file) => upload(file))} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input placeholder="…или вставьте ссылку на фото" value={purl} onChange={(e) => setPurl(e.target.value)} />
                <button type="button" className="abtn sm" onClick={() => { if (purl.trim()) { set('photos', [...f.photos, purl.trim()]); setPurl(''); } }}>Добавить</button>
              </div>
            </div>
            <div className="full"><label><input type="checkbox" checked={f.hidden} onChange={(e) => set('hidden', e.target.checked)} /> Скрыть с сайта (черновик)</label></div>
          </div>
          <p><button className="abtn acc" disabled={busy} onClick={save}>Сохранить</button> <button className="abtn ghost" onClick={() => setF(null)}>Отмена</button></p>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-grid2">
          <div><input placeholder="Поиск по названию или бренду" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div><select value={flt} onChange={(e) => setFlt(e.target.value)}>
            <option value="all">Все</option><option value="live">В наличии</option><option value="sold">Проданные</option><option value="hidden">Скрытые и черновики</option>
          </select></div>
        </div>
        {list.map((p) => (
          <div className="adm-row" key={p.id}>
            {p.photo ? <img src={imgSrc(p.photo)} alt="" /> : <div className="ph" />}
            <div className="info">
              <b>{p.name}</b>
              {p.sold && <span className="adm-tag">Продано</span>}{p.hidden && <span className="adm-tag">Скрыт</span>}
              <br /><small>{p.brand ? p.brand + ' · ' : ''}{p.category} · {(p.sizes || []).join(', ') || '—'} · {fmt(p.price)} грн{p.cost != null ? ` (себестоимость ${fmt(p.cost)})` : ''}</small>
            </div>
            <div className="acts">
              <button className="abtn sm" onClick={() => upd(p, { sold: !p.sold, sold_at: !p.sold ? new Date().toISOString() : null })}>{p.sold ? 'Вернуть' : 'Продано'}</button>
              <button className="abtn sm ghost" onClick={() => upd(p, { hidden: !p.hidden })}>{p.hidden ? 'Опубликовать' : 'Скрыть'}</button>
              <button className="abtn sm ghost" onClick={() => open(p)}>Изменить</button>
              <button className="abtn sm red" onClick={() => del(p)}>Удалить</button>
            </div>
          </div>
        ))}
        {!list.length && <p>Ничего не найдено.</p>}
      </div>

      <div className="adm-card">
        <h2>Категории</h2>
        <div className="adm-cats">{cats.map((c) => (
          <span key={c.id} className="adm-cat" style={{ background: c.color, color: c.text_color }}>{c.name}<button onClick={() => delCat(c)} aria-label="Удалить">×</button></span>
        ))}</div>
        <div className="adm-grid2">
          <div><label>Название</label><input value={cn} onChange={(e) => setCn(e.target.value)} /></div>
          <div><label>Цвет плитки / цвет текста</label><input type="color" value={c1} onChange={(e) => setC1(e.target.value)} /> <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} /></div>
        </div>
        <p><button className="abtn acc" onClick={addCat}>Добавить категорию</button></p>
      </div>
    </>
  );
}
