// Каркас админки: закрыт от поисковиков (noindex)
import '@/app/globals.css';

export const metadata = { title: 'Админка — Degrees° 12', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Manrope:wght@400;500;600;700&display=swap" />
      </head>
      <body className="adm-body">{children}</body>
    </html>
  );
}
