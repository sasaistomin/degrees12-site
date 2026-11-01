'use client';
// Галерея на странице товара: карусель со свайпом (листается пальцем влево-вправо), точки, стрелки на компьютере и превью.
// Все фото лежат в HTML (для поисковиков); перелистывание делает сам браузер через CSS scroll-snap, поэтому оно плавное и лёгкое.
import { useRef, useState } from 'react';
import { imgSrc } from '@/lib/utils';

export default function Gallery({ photos, name, sold, soldText, bg, fg }) {
  const [i, setI] = useState(0);        // номер текущего фото
  const track = useRef(null);
  const many = photos.length > 1;

  // Прокрутить к фото номер k (по превью, точкам или стрелкам)
  const go = (k) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(photos.length - 1, k));
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };
  // При свайпе вычисляем, какое фото сейчас по центру
  const onScroll = () => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const k = Math.round(el.scrollLeft / el.clientWidth);
    if (k !== i) setI(k);
  };

  return (
    <div className="prod-media">
      <div className="prod-img">
        {photos.length ? (
          <div className="slides" ref={track} onScroll={onScroll} tabIndex={0} aria-label={name}>
            {photos.map((u, k) => (
              <div className="slide" key={u + k}>
                <img src={imgSrc(u)} alt={k ? `${name} ${k + 1}` : name} loading={k ? 'lazy' : 'eager'} draggable={false} referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        ) : (
          <span className="pc-fb" style={{ background: bg, color: fg }}>{name}</span>
        )}
        {sold && <span className="badge">{soldText}</span>}
        {many && (
          <>
            <button type="button" className="gal-nav prev" aria-label="←" disabled={i === 0} onClick={() => go(i - 1)}>‹</button>
            <button type="button" className="gal-nav next" aria-label="→" disabled={i === photos.length - 1} onClick={() => go(i + 1)}>›</button>
            <div className="dots" aria-hidden="true">
              {photos.map((_, k) => <span key={k} className={k === i ? 'on' : ''} onClick={() => go(k)} />)}
            </div>
          </>
        )}
      </div>
      {many && (
        <div className="thumbs">
          {photos.map((u, k) => (
            <button key={u + k} type="button" className={k === i ? 'on' : ''} onClick={() => go(k)} aria-label={`${name} ${k + 1}`}>
              <img src={imgSrc(u)} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
