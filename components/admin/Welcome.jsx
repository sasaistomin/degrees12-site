'use client';
// Вкладка 1: приветствие и быстрая сводка
import { fmt } from './adminLib';

export default function Welcome({ products, go, newOrders = 0 }) {
  const h = new Date().getHours();
  const hello = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const sold = products.filter((p) => p.sold);
  const hidden = products.filter((p) => p.hidden && !p.sold);
  const live = products.filter((p) => !p.sold && !p.hidden);
  const stock = live.reduce((s, p) => s + Number(p.price || 0), 0);
  return (
    <>
      <h1>{hello}, Sasha 👋</h1>
      <p className="adm-sub">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}. Вот что происходит в магазине.</p>
      <div className="adm-stats">
        <div className="adm-stat dark"><small>В наличии</small><b>{live.length}</b></div>
        <div className="adm-stat" style={{ cursor: 'pointer' }} onClick={() => go('orders')}><small>Новые заказы</small><b>{newOrders}</b></div>
        <div className="adm-stat"><small>Продано</small><b>{sold.length}</b></div>
        <div className="adm-stat"><small>Черновики и скрытые</small><b>{hidden.length}</b></div>
        <div className="adm-stat"><small>Стоимость остатков</small><b>{fmt(stock)} грн</b></div>
      </div>
      <div className="adm-card">
        <h2>С чего начать</h2>
        <p style={{ marginTop: 0 }}>Добавьте новую вещь, посмотрите доходы и посетителей или найдите товары в других магазинах.</p>
        <button className="abtn acc" onClick={() => go('products')}>+ Добавить товар</button>{' '}
        <button className="abtn ghost" onClick={() => go('analytics')}>Доходы и посетители</button>{' '}
        <button className="abtn ghost" onClick={() => go('sourcing')}>Поиск товаров</button>
      </div>
      <div className="adm-card">
        <h2>Подсказки</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Когда вещь продана, нажмите «Продано»: она попадёт в график доходов.</li>
          <li>Чтобы в прибыль считалась маржа, указывайте закупочную цену («Себестоимость»).</li>
          <li>Товары из «Поиска товаров» добавляются скрытыми: проверьте их и нажмите «Опубликовать».</li>
        </ul>
      </div>
    </>
  );
}
