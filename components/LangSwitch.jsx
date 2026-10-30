'use client';
// Переключатель языка: ведёт на ту же страницу, но с другим языком в адресе (/ru/... -> /en/...)
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS = { ru: 'RU', uk: 'UA', en: 'EN' };

export default function LangSwitch({ locale }) {
  const rest = (usePathname() || '').split('/').slice(2).join('/');
  return (
    <div className="lang" role="group" aria-label="Language">
      {Object.keys(LABELS).map((l) => (
        <Link key={l} href={`/${l}${rest ? '/' + rest : ''}`} hrefLang={l} aria-current={l === locale ? 'true' : undefined}>{LABELS[l]}</Link>
      ))}
    </div>
  );
}
