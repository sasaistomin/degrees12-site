'use client';
// Админка: вход, меню вкладок и общие данные (товары, категории).
// Вкладки: Приветствие · Доходы и посетители · Товары · Поиск товаров
import { useCallback, useEffect, useState } from 'react';
import { sb, toEmail } from './adminLib';
import Welcome from './Welcome';
import Orders from './Orders';
import Analytics from './Analytics';
import ProductsTab from './ProductsTab';
import Sourcing from './Sourcing';

const TABS = [['welcome', 'Приветствие'], ['orders', 'Заказы'], ['analytics', 'Доходы и посетители'], ['products', 'Товары'], ['sourcing', 'Поиск товаров']];

export default function AdminApp() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('welcome');
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [toast, setToast] = useState('');
  const [newOrders, setNewOrders] = useState(0);   // число новых заказов (значок на вкладке)
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');

  const say = useCallback((t) => { setToast(t); setTimeout(() => setToast(''), 3000); }, []);

  // Загрузка товаров (включая скрытые — мы админ) и категорий
  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      sb.from('categories').select('*').order('position'),
      sb.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setCats(c.data || []);
    setProducts(p.data || []);
    const o = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new');
    setNewOrders(o.count || 0);
  }, []);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    const h = location.hash.slice(1);
    if (TABS.some((t) => t[0] === h)) setTab(h);
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem('noTrack', '1'); } catch { /* ок */ } // свои визиты в статистику не попадают
    load();
  }, [session, load]);

  const go = (t) => { setTab(t); history.replaceState(null, '', '#' + t); window.scrollTo(0, 0); };
  const signIn = async (e) => {
    e.preventDefault();
    const r = await sb.auth.signInWithPassword({ email: toEmail(login), password: pass });
    if (r.error) say(r.error.message === 'Invalid login credentials' ? 'Неверный логин или пароль' : 'Ошибка: ' + r.error.message);
  };

  if (!ready) return null;
  if (!session) {
    return (
      <form className="adm adm-login" style={{ display: 'block' }} onSubmit={signIn}>
        <h1>Вход в админку</h1><p className="adm-sub">DEGREES° 12</p>
        <label>Логин</label><input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
        <label>Пароль</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        <p><button className="abtn acc" type="submit">Войти</button></p>
        {toast && <div className="adm-toast">{toast}</div>}
      </form>
    );
  }

  const props = { products, cats, reload: load, say, go, newOrders };
  return (
    <div className="adm">
      <aside className="adm-side">
        <a className="brand" href="/"><img src="/logo.jpg" alt="" width="40" height="40" /><span>DEGREES° 12</span></a>
        {TABS.map(([id, name]) => <button key={id} className={'tab' + (tab === id ? ' on' : '')} onClick={() => go(id)}>{name}{id === 'orders' && newOrders > 0 ? ` (${newOrders})` : ''}</button>)}
        <div className="sp" />
        <a className="tab" href="/" target="_blank" rel="noopener noreferrer">Открыть сайт ↗</a>
        <button className="tab" onClick={() => sb.auth.signOut()}>Выйти</button>
      </aside>
      <main className="adm-main">
        {tab === 'welcome' && <Welcome {...props} />}
        {tab === 'orders' && <Orders {...props} />}
        {tab === 'analytics' && <Analytics {...props} />}
        {tab === 'products' && <ProductsTab {...props} />}
        {tab === 'sourcing' && <Sourcing {...props} />}
      </main>
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  );
}
