'use client';
// Сетка товаров с сортировкой по цене. Все товары уже есть в HTML (для поисковиков),
// сортировка просто переставляет их в браузере.
import { useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, locale, d, cats }) {
  const [sort, setSort] = useState('default');
  const list = [...products];
  if (sort === 'asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'desc') list.sort((a, b) => b.price - a.price);
  return (
    <>
      <div className="grid-bar">
        <span>{products.length} {d.items}</span>
        <label>{d.sort}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">{d.sortDefault}</option>
            <option value="desc">{d.sortDesc}</option>
            <option value="asc">{d.sortAsc}</option>
          </select>
        </label>
      </div>
      <div className="grid">
        {list.map((p) => <ProductCard key={p.id} p={p} locale={locale} d={d} cats={cats} />)}
        {!list.length && <p className="empty">{d.empty}</p>}
      </div>
    </>
  );
}
