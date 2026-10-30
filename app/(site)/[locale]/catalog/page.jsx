// Каталог: все товары (в HTML для поисковиков) + сортировка по цене
import ProductGrid from '@/components/ProductGrid';
import CategoryNav from '@/components/CategoryNav';
import { getDict } from '@/lib/i18n';
import { getProducts, getCategories } from '@/lib/data';
import { pageMeta } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  return pageMeta({ locale, path: '/catalog', title: d.catalogTitle, description: d.catalogDesc });
}

export default async function Catalog({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  return (
    <section className="wrap sec">
      <h1 className="h1">{d.catalogTitle}</h1>
      <CategoryNav locale={locale} cats={cats} d={d} />
      <ProductGrid products={products} locale={locale} d={d} cats={cats} />
    </section>
  );
}
