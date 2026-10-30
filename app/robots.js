// app/robots.js — правила для поисковых роботов (/robots.txt)
import { SITE_URL } from '@/lib/config';
export default function robots() {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
