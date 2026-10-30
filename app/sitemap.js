// app/sitemap.js — карта сайта для Google (/sitemap.xml): все языки, категории и товары
import { SITE_URL, LOCALES } from '@/lib/config';
import { getProducts, getCategories, categorySlug } from '@/lib/data';
import { productSlug } from '@/lib/utils';

export const revalidate = 3600;

export default async function sitemap() {
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  const out = [];
  for (const l of LOCALES) {
    for (const p of ['', '/catalog', '/about']) out.push({ url: `${SITE_URL}/${l}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.8 });
    cats.forEach((c) => out.push({ url: `${SITE_URL}/${l}/category/${categorySlug(c)}`, changeFrequency: 'weekly', priority: 0.7 }));
    products.forEach((p) => out.push({ url: `${SITE_URL}/${l}/product/${productSlug(p)}`, lastModified: p.created_at, changeFrequency: 'weekly', priority: 0.6 }));
  }
  return out;
}
