'use client';
// Выбор размера и кнопка «В корзину» на странице товара
import { useState } from 'react';
import Link from 'next/link';
import { useCart, addToCart } from '@/lib/cart';

export default function AddToCart({ id, sizes, locale, d }) {
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [err, setErr] = useState(false);
  const inCart = useCart().some((x) => x.id === id);
  return (
    <div className="atc">
      {sizes.length > 0 && (
        <div className="atc-sizes">
          <span>{d.chooseSize}</span>
          {sizes.map((s) => <button type="button" key={s} className={size === s ? 'on' : ''} onClick={() => { setSize(s); setErr(false); }}>{s}</button>)}
        </div>
      )}
      {err && <p className="atc-err">{d.chooseSize}</p>}
      {inCart
        ? <Link className="btn" href={`/${locale}/cart`}>{d.goCart} →</Link>
        : <button type="button" className="btn" onClick={() => { if (sizes.length && !size) return setErr(true); addToCart(id, size); }}>{d.addToCart}</button>}
    </div>
  );
}
