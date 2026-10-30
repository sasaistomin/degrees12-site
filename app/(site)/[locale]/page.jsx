// Главная страница: герой, категории, новые поступления, преимущества
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { getDict, catName } from '@/lib/i18n';
import { getProducts, getCategories, categorySlug } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { SITE_URL, CONTACT } from '@/lib/config';
import { imgSrc } from '@/lib/utils';

export const revalidate = 60; // страница обновляется не реже раза в минуту

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  return { ...pageMeta({ locale, title: d.siteTitle, description: d.siteDesc }), title: { absolute: d.siteTitle } };
}

export default async function Home({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  const featured = products.find((p) => p.photo && !p.sold) || products[0];
  const count = (name) => products.filter((p) => p.category === name && !p.sold).length;
  const ring = 'ARCHIVE FASHION • DEGREES° 12 • VINTAGE • ONE OF A KIND • ';

  return (
    <>
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'Degrees° 12', url: SITE_URL, logo: `${SITE_URL}/logo.jpg`, sameAs: [CONTACT.telegram, CONTACT.instagram] },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Degrees° 12', url: `${SITE_URL}/${locale}` },
      ]} />

      <section className="hero wrap">
        <div className="hero-txt">
          <span className="pill">{d.heroTag}</span>
          <h1>{d.heroA}<br /><em>{d.heroB}</em></h1>
          <p>{d.heroText}</p>
          <div className="hero-btns">
            <Link href={`/${locale}/catalog`} className="btn">{d.viewCatalog} →</Link>
            <Link href={`/${locale}/about`} className="btn ghost">{d.heroMore}</Link>
          </div>
        </div>
        <div className="hero-art">
          <svg viewBox="0 0 200 200" className="spin" aria-hidden="true">
            <defs><path id="ring" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" /></defs>
            <text><textPath href="#ring" textLength="512" lengthAdjust="spacing">{ring}</textPath></text>
          </svg>
          <div className="hero-card">
            {featured?.photo ? <img src={imgSrc(featured.photo)} alt={featured.name} /> : <img src="/logo.jpg" alt="Degrees° 12" className="logo-fb" />}
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div>{Array.from({ length: 8 }).map((_, i) => <span key={i}>ARCHIVE FASHION ✦ VINTAGE ✦ ONE OF A KIND ✦ </span>)}</div></div>

      <section className="wrap sec">
        <h2>{d.categoriesTitle}</h2>
        <div className="bento">
          {cats.map((c) => (
            <Link key={c.id} href={`/${locale}/category/${categorySlug(c)}`} className="tile" style={{ background: c.color, color: c.text_color }}>
              <span>{count(c.name)} {d.pcs}</span>
              <strong>{catName(locale, c.name)}</strong>
              <i>↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap sec">
        <div className="sec-head"><h2>{d.newArrivals}</h2><Link href={`/${locale}/catalog`}>{d.seeAll} →</Link></div>
        <div className="grid">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} locale={locale} d={d} cats={cats} />)}
          {!products.length && <p className="empty">{d.empty}</p>}
        </div>
      </section>

      <section className="wrap sec">
        <h2>{d.whyTitle}</h2>
        <div className="why">
          {[['01', d.u1t, d.u1d], ['02', d.u2t, d.u2d], ['03', d.u3t, d.u3d]].map(([n, t, x]) => (
            <div key={n}><b>{n}</b><h3>{t}</h3><p>{x}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
