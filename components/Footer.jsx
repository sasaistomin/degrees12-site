// Подвал сайта
import Link from 'next/link';
import { getDict } from '@/lib/i18n';
import { CONTACT } from '@/lib/config';

export default function Footer({ locale }) {
  const d = getDict(locale);
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-big">DEGREES° 12</div>
        <div className="ft-cols">
          <div><h4>{d.footNav}</h4>
            <Link href={`/${locale}`}>{d.home}</Link><Link href={`/${locale}/catalog`}>{d.catalog}</Link><Link href={`/${locale}/about`}>{d.about}</Link></div>
          <div><h4>{d.footSocial}</h4>
            <a href={CONTACT.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
            <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></div>
          <div><h4>Archive Fashion</h4><p>{d.siteDesc}</p></div>
        </div>
        <p className="ft-copy">© {new Date().getFullYear()} Degrees° 12 · {d.rights}</p>
      </div>
    </footer>
  );
}
