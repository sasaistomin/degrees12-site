'use client';
// Анонимный счётчик посещений для статистики в админке.
// Без cookie: в браузере хранится случайный номер, чтобы отличать новых посетителей от повторных.
// Визиты самого админа не считаются (флаг noTrack ставится при входе в админку).
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { browserClient } from '@/lib/supabase';

export default function Tracker() {
  const path = usePathname();
  useEffect(() => {
    try {
      if (localStorage.getItem('noTrack')) return;
      let id = localStorage.getItem('vid');
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('vid', id); }
      browserClient().from('page_views').insert({ path, locale: (path || '').split('/')[1] || null, visitor_id: id }).then(() => {}, () => {});
    } catch { /* статистика не должна ломать сайт */ }
  }, [path]);
  return null;
}
