'use client';
// Значок корзины в шапке с числом вещей
import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function CartButton({ locale, label }) {
  const n = useCart().length;
  return (
    <Link href={`/${locale}/cart`} className="cartbtn" aria-label={`${label}: ${n}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {n > 0 && <b>{n}</b>}
    </Link>
  );
}
