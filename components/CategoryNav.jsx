// Кнопки категорий — обычные ссылки на отдельные страницы категорий (поисковики их видят)
import Link from 'next/link';
import { catName } from '@/lib/i18n';
import { categorySlug } from '@/lib/data';

export default function CategoryNav({ locale, cats, active, d }) {
  return (
    <div className="chips">
      <Link href={`/${locale}/catalog`} className={!active ? 'on' : ''}>{d.all}</Link>
      {cats.map((c) => (
        <Link key={c.id} href={`/${locale}/category/${categorySlug(c)}`} className={active === c.name ? 'on' : ''}>{catName(locale, c.name)}</Link>
      ))}
    </div>
  );
}
