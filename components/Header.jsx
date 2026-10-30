// Шапка сайта: логотип, меню, переключатель языка
import Link from 'next/link';
import LangSwitch from './LangSwitch';
import { getDict } from '@/lib/i18n';

export default function Header({ locale }) {
  const d = getDict(locale);
  return (
    <header className="hd">
      <div className="wrap hd-in">
        <Link href={`/${locale}`} className="brand" aria-label="Degrees° 12">
          <img src="/logo.jpg" alt="" width="40" height="40" />
          <span>DEGREES° 12</span>
        </Link>
        <nav aria-label="Main">
          <Link href={`/${locale}`}>{d.home}</Link>
          <Link href={`/${locale}/catalog`}>{d.catalog}</Link>
          <Link href={`/${locale}/about`}>{d.about}</Link>
        </nav>
        <LangSwitch locale={locale} />
      </div>
    </header>
  );
}
