// Страница «О нас»
import Link from 'next/link';
import { getDict } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  return pageMeta({ locale, path: '/about', title: d.aboutTitle, description: d.aboutDesc });
}

export default async function About({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  return (
    <section className="wrap sec about">
      <div>
        <h1 className="h1">{d.aboutTitle}</h1>
        <p className="lead">{d.aboutP1}</p>
        <p>{d.aboutP2}</p>
        <Link href={`/${locale}/catalog`} className="btn">{d.viewCatalog} →</Link>
      </div>
      <div className="facts">
        <h2>{d.howTitle}</h2>
        <ul>{[d.f1, d.f2, d.f3, d.f4].map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </section>
  );
}
