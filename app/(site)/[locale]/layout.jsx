// Общий каркас публичного сайта: <html lang>, шапка, подвал, счётчик посещений
import '@/app/globals.css';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Tracker from '@/components/Tracker';
import { getDict } from '@/lib/i18n';
import { LOCALES, SITE_URL } from '@/lib/config';

export function generateStaticParams() { return LOCALES.map((locale) => ({ locale })); }

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const d = getDict(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: d.siteTitle, template: '%s · Degrees° 12' },
    description: d.siteDesc,
    robots: { index: true, follow: true },
    icons: { icon: '/logo.jpg', apple: '/logo.jpg' },
  };
}
export const viewport = { themeColor: '#1d120b' };

export default async function SiteLayout({ children, params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Manrope:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
        <Tracker />
      </body>
    </html>
  );
}
