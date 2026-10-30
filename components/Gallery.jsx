'use client';
// Галерея на странице товара: большое фото + маленькие превью (все фото есть в HTML для поисковиков)
import { useState } from 'react';
import { imgSrc } from '@/lib/utils';

export default function Gallery({ photos, name, sold, soldText, bg, fg }) {
  const [i, setI] = useState(0);
  return (
    <div className="prod-media">
      <div className="prod-img">
        {photos.length
          ? <img src={imgSrc(photos[i])} alt={name} referrerPolicy="no-referrer" />
          : <span className="pc-fb" style={{ background: bg, color: fg }}>{name}</span>}
        {sold && <span className="badge">{soldText}</span>}
      </div>
      {photos.length > 1 && (
        <div className="thumbs">
          {photos.map((u, k) => (
            <button key={u + k} type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${name} ${k + 1}`}>
              <img src={imgSrc(u)} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
