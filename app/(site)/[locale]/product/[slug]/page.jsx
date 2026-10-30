// Страница товара: фото, размеры, цена, кнопки «Заказать», данные schema.org Product для Google
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import ProductCard from '@/components/ProductCard';
import { getDict, catName } from '@/lib/i18n';
import { getProductBySlug, getProducts, getCategories, categorySlug } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { SITE_URL, CONTACT } from '@/lib/config';
import { imgSrc, absUrl, money, productSlug } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const d = getDict(locale);
  const sizes = (p.sizes || []).join(', ');
  const desc = p.description || `${p.brand ? p.brand + ' — ' : ''}${p.name}. ${catName(locale, p.category)}${sizes ? `, ${d.size.toLowerCase()}: ${sizes}` : ''}. ${money(p.price, locale)}. ${d.siteDesc}`;
  return pageMeta({ locale, path: `/product/${productSlug(p)}`, title: p.name, description: desc.slice(0, 300), image: absUrl(p.photo) });
}

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const d = getDict(locale);
  const [all, cats] = await Promise.all([getProducts(), getCategories()]);
  const cat = cats.find((c) => c.name === p.category);
  const related = all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const url = `${SITE_URL}/${locale}/product/${productSlug(p)}`;

  return (
    <>
      <JsonLd data={[
        {
          '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.id,
          image: p.photo ? [absUrl(p.photo)] : [`${SITE_URL}/logo.jpg`],
          description: p.description || `${p.name} — ${catName(locale, p.category)}`,
          brand: { '@type': 'Brand', name: p.brand || 'Degrees° 12' }, category: p.category,
          offers: { '@type': 'Offer', url, priceCurrency: 'UAH', price: p.price, itemCondition: 'https://schema.org/UsedCondition',
            availability: p.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' },
        },
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: d.home, item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: d.catalog, item: `${SITE_URL}/${locale}/catalog` },
            { '@type': 'ListItem', position: 3, name: p.name, item: url },
          ],
        },
      ]} />

      <section className="wrap sec prod">
        <div className="prod-img">
          {p.photo ? <img src={imgSrc(p.photo)} alt={p.name} /> : <span className="pc-fb" style={{ background: cat?.color || '#4a3223', color: cat?.text_color || '#f6efe3' }}>{p.name}</span>}
          {p.sold && <span className="badge">{d.soldOut}</span>}
        </div>
        <div className="prod-info">
          <nav className="crumbs" aria-label="breadcrumb">
            <Link href={`/${locale}/catalog`}>{d.catalog}</Link> / {cat && <Link href={`/${locale}/category/${categorySlug(cat)}`}>{catName(locale, p.category)}</Link>}
          </nav>
          {p.brand && <div className="pc-meta">{p.brand}</div>}
          <h1>{p.name}</h1>
          <div className="prod-price">{money(p.price, locale)}</div>
          <div className="prod-sizes"><span>{d.size}</span>{(p.sizes || []).map((s) => <b key={s}>{s}</b>)}</div>
          {p.description && <p className="prod-desc">{p.description}</p>}
          <dl className="prod-dl">
            <dt>{d.category}</dt><dd>{catName(locale, p.category)}</dd>
            {p.brand && <><dt>{d.brand}</dt><dd>{p.brand}</dd></>}
            <dt>{d.details}</dt><dd>{p.sold ? d.soldOut : d.inStock}</dd>
          </dl>
          {!p.sold && (
            <div className="order">
              <h3>{d.orderTitle}</h3><p>{d.orderText}</p>
              <div className="hero-btns">
                <a className="btn" href={CONTACT.telegram} target="_blank" rel="noopener noreferrer">{d.orderTg} →</a>
                <a className="btn ghost" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">{d.orderIg}</a>
              </div>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="wrap sec">
          <h2>{catName(locale, p.category)}</h2>
          <div className="grid">{related.map((x) => <ProductCard key={x.id} p={x} locale={locale} d={d} cats={cats} />)}</div>
        </section>
      )}
    </>
  );
}
