// ============================================================
// lib/config.js — главные настройки сайта. Менять можно здесь.
// Ключ Supabase публичный (publishable): защиту обеспечивают правила базы (RLS).
// ============================================================
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fseaiqzignahclkcbjhw.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PLR4SaBIwcqRvlmtpV1TFw_hW2r-o8G';
// Адрес сайта (нужен для sitemap, canonical и Open Graph). Замените на свой домен, когда подключите его.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://degrees12-site.vercel.app').replace(/\/$/, '');
// Почта админа (логин «Istomin Sasha M» превращается в неё). Должна совпадать с supabase/schema.sql
export const ADMIN_EMAIL = 'istomin.sasha.m@degrees12.shop';
export const LOCALES = ['ru', 'uk', 'en'];
export const DEFAULT_LOCALE = 'ru';
export const CURRENCY = { ru: 'грн', uk: 'грн', en: 'UAH' };
// Куда ведут кнопки «Заказать» (замените на свои ссылки)
export const CONTACT = { telegram: 'https://t.me/degrees12', instagram: 'https://instagram.com/degrees12' };
