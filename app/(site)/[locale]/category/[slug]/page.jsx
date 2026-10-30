// Страница категории: свой адрес, свой заголовок — так её находят в поиске («купить худи Archive»)
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import CategoryNav from '@/components/CategoryNav';
import { getDict, catName } from '@/lib/i18n';
import { getProducts, getCategories, getCategoryBySlug } from '@/lib/data';
import { pageMeta } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const c = await getCategoryBySlug(slug);
  if (!c) return {};
  const d = getDict(locale);
  const n = catName(locale, c.name);
  return pageMeta({ locale, path: `/category/${slug}`, title: `${n} — ${d.catalogTitle}`, description: `${n}: ${d.catalogDesc}` });
}

export default async function CategoryPage({ params }) {
  const { locale, slug } = await params;
  const c = await getCategoryBySlug(slug);
  if (!c) notFound();
  const d = getDict(locale);
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  return (
    <section className="wrap sec">
      <h1 className="h1">{catName(locale, c.name)}</h1>
      <CategoryNav locale={locale} cats={cats} active={c.name} d={d} />
      <ProductGrid products={products.filter((p) => p.category === c.name)} locale={locale} d={d} cats={cats} />
    </section>
  );
}
