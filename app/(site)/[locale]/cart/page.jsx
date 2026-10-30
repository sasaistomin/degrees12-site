// Страница корзины и оформления заказа (закрыта от индексации)
import CartView from '@/components/CartView';
import { getDict } from '@/lib/i18n';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: getDict(locale).cart, robots: { index: false, follow: false } };
}

export default async function CartPage({ params }) {
  const { locale } = await params;
  return <CartView locale={locale} d={getDict(locale)} />;
}
