'use client';
// Корзина и оформление заказа. Заказ отправляется в базу функцией place_order (цены и наличие проверяет база).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart, removeFromCart, clearCart } from '@/lib/cart';
import { browserClient } from '@/lib/supabase';
import { imgSrc, money, photoList, productSlug } from '@/lib/utils';

export default function CartView({ locale, d }) {
  const cart = useCart();
  const [rows, setRows] = useState(null);   // актуальные данные товаров из базы
  const [f, setF] = useState({ name: '', phone: '', city: '', delivery: 'nova_poshta', address: '', payment: 'cod', comment: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const key = cart.map((x) => x.id).join(',');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!key) { setRows([]); return; }
    let off = false;
    browserClient().from('products').select('id,name,brand,price,photo,photos,sold,reserved,hidden').in('id', key.split(','))
      .then(({ data }) => { if (!off) setRows(data || []); });
    return () => { off = true; };
  }, [key]);

  const lines = cart.map((c) => {
    const p = (rows || []).find((r) => r.id === c.id);
    return { ...c, p, ok: !!p && !p.sold && !p.reserved && !p.hidden };
  });
  const total = lines.filter((l) => l.ok).reduce((s, l) => s + Number(l.p.price), 0);
  const bad = lines.some((l) => !l.ok);

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (f.name.trim().length < 2) return setErr(d.errName);
    if (f.phone.replace(/\D/g, '').length < 9) return setErr(d.errPhone);
    if (f.delivery !== 'pickup' && (!f.city.trim() || !f.address.trim())) return setErr(d.errFields);
    setBusy(true);
    const r = await browserClient().rpc('place_order', {
      p_name: f.name.trim(), p_phone: f.phone.trim(), p_city: f.city.trim(), p_delivery: f.delivery, p_address: f.address.trim(),
      p_payment: f.payment, p_comment: f.comment.trim(), p_locale: locale, p_items: lines.map((l) => ({ id: l.id, size: l.size })),
    });
    setBusy(false);
    if (r.error) return setErr(/unavailable/.test(r.error.message) ? d.errUnavail : d.errGeneric);
    // уведомление владельцу в Telegram (если настроено); ошибки покупателю не показываем
    fetch('/api/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: r.data.id, secret: r.data.secret }) }).catch(() => {});
    clearCart();
    setDone({ number: r.data.number, total: r.data.total });
  };

  if (done) return (
    <section className="wrap sec cart-done">
      <h1 className="h1">{d.orderDone}</h1>
      <p className="lead">{d.orderNum}: <b>#{done.number}</b> · {money(done.total, locale)}</p>
      <p>{d.orderThanks}</p>
      <Link className="btn" href={`/${locale}/catalog`}>{d.viewCatalog} →</Link>
    </section>
  );
  if (!cart.length) return (
    <section className="wrap sec">
      <h1 className="h1">{d.cart}</h1>
      <p>{d.emptyCart}</p>
      <Link className="btn" href={`/${locale}/catalog`}>{d.viewCatalog} →</Link>
    </section>
  );
  return (
    <section className="wrap sec">
      <h1 className="h1">{d.cart}</h1>
      <div className="cart">
        <div>
          {lines.map((l) => (
            <div className={'cart-row' + (l.ok ? '' : ' off')} key={l.id}>
              {l.p && photoList(l.p)[0] ? <img src={imgSrc(photoList(l.p)[0])} alt="" referrerPolicy="no-referrer" /> : <div className="cart-ph" />}
              <div className="cart-info">
                {l.p ? <Link href={`/${locale}/product/${productSlug(l.p)}`}><b>{l.p.name}</b></Link> : <b>…</b>}
                <small>{l.p?.brand ? l.p.brand + ' · ' : ''}{l.size ? `${d.size} ${l.size}` : ''}</small>
                {rows && !l.ok && <em>{d.unavailable}</em>}
              </div>
              <div className="cart-price">{l.p ? money(l.p.price, locale) : ''}</div>
              <button type="button" className="cart-x" aria-label={d.remove} title={d.remove} onClick={() => removeFromCart(l.id)}>✕</button>
            </div>
          ))}
          <div className="cart-total"><span>{d.total}</span><b>{money(total, locale)}</b></div>
          {bad && <p className="atc-err">{d.unavailableNote}</p>}
        </div>

        <form className="checkout" onSubmit={submit}>
          <h2>{d.checkout}</h2>
          <label>{d.fName}<input value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" required /></label>
          <label>{d.fPhone}<input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="+380" required /></label>
          <label>{d.fDelivery}
            <select value={f.delivery} onChange={(e) => set('delivery', e.target.value)}>
              <option value="nova_poshta">{d.dNP}</option><option value="ukrposhta">{d.dUP}</option><option value="pickup">{d.dPickup}</option>
            </select>
          </label>
          {f.delivery !== 'pickup' && <>
            <label>{d.fCity}<input value={f.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" /></label>
            <label>{d.fAddress}<input value={f.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" /></label>
          </>}
          <label>{d.fPayment}
            <select value={f.payment} onChange={(e) => set('payment', e.target.value)}>
              <option value="cod">{d.pCod}</option><option value="card">{d.pCard}</option>
            </select>
          </label>
          {f.payment === 'card' && <p className="note">{d.payNote}</p>}
          <label>{d.fComment}<textarea value={f.comment} onChange={(e) => set('comment', e.target.value)} /></label>
          {err && <p className="atc-err">{err}</p>}
          <button className="btn" type="submit" disabled={busy || bad || !rows}>{busy ? d.sending : `${d.placeOrder} · ${money(total, locale)}`}</button>
        </form>
      </div>
    </section>
  );
}
