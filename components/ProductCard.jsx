// Карточка товара (используется в каталоге, на главной и в «похожих»)
import Link from 'next/link';
import { imgSrc, money, productSlug } from '@/lib/utils';
import { catName } from '@/lib/i18n';

export default function ProductCard({ p, locale, d, cats = [] }) {
  const cat = cats.find((c) => c.name === p.category);
  return (
    <Link href={`/${locale}/product/${productSlug(p)}`} className={'pc' + (p.sold ? ' sold' : '')}>
      <div className="pc-img">
        {p.photo
          ? <img src={imgSrc(p.photo)} alt={p.name} loading="lazy" />
          : <span className="pc-fb" style={{ background: cat?.color || '#4a3223', color: cat?.text_color || '#f6efe3' }}>{p.name}</span>}
        {p.sold && <span className="badge">{d.soldOut}</span>}
      </div>
      <div className="pc-meta">{p.brand || catName(locale, p.category)}</div>
      <h3>{p.name}</h3>
      <div className="pc-row">
        <span className="pc-price">{money(p.price, locale)}</span>
        <span className="pc-sizes">{(p.sizes || []).slice(0, 5).join(' · ')}</span>
      </div>
    </Link>
  );
}
