// middleware.js — если в адресе нет языка (/ или /catalog), отправляем на /ru, /uk или /en по языку браузера
import { NextResponse } from 'next/server';
const LOCALES = ['ru', 'uk', 'en'];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return NextResponse.next();
  const lang = (req.headers.get('accept-language') || '').slice(0, 2).toLowerCase();
  const locale = lang === 'uk' ? 'uk' : lang === 'en' ? 'en' : 'ru';
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}
// Не трогаем админку, API, служебные файлы и любые файлы с расширением (картинки, sitemap.xml, robots.txt)
export const config = { matcher: ['/((?!admin|api|_next|.*\\..*).*)'] };
