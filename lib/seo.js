// lib/seo.js — SEO-помощники: canonical, hreflang, Open Graph, Twitter
import { SITE_URL, LOCALES } from './config';

// Ссылки на версии страницы на всех языках (hreflang) + canonical
export function alternates(locale, path = '') {
  const languages = {};
  LOCALES.forEach((l) => { languages[l] = `${SITE_URL}/${l}${path}`; });
  languages['x-default'] = `${SITE_URL}/ru${path}`;
  return { canonical: `${SITE_URL}/${locale}${path}`, languages };
}

// Готовый объект metadata для страницы
export function pageMeta({ locale, path = '', title, description, image, type = 'website' }) {
  const url = `${SITE_URL}/${locale}${path}`;
  const img = image || `${SITE_URL}/logo.jpg`;
  return {
    title, description,
    alternates: alternates(locale, path),
    openGraph: { title, description, url, siteName: 'Degrees° 12', type, locale: { ru: 'ru_UA', uk: 'uk_UA', en: 'en_US' }[locale], images: [{ url: img }] },
    twitter: { card: 'summary_large_image', title, description, images: [img] },
  };
}
