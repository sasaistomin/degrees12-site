// Страница 404 (товар или категория не найдены)
import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="wrap sec" style={{ textAlign: 'center', padding: '120px 0' }}>
      <div className="h1">404</div>
      <p>Page not found · Сторінку не знайдено · Страницу не нашли</p>
      <Link href="/" className="btn">Degrees° 12 →</Link>
    </section>
  );
}
