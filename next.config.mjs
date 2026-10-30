// next.config.mjs — настройки Next.js.
// Редиректы: адреса без языка (/, /catalog …) отправляем на /uk, /en или /ru по языку браузера.
// Это работает на уровне платформы, без отдельного кода (раньше для этого был middleware.js).
const header = (lang) => ({ type: 'header', key: 'accept-language', value: `^${lang}.*` });
const PAGES = ['', '/catalog', '/about', '/category/:slug', '/product/:slug'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    const rules = [];
    for (const p of PAGES) {
      const source = p || '/';
      rules.push({ source, has: [header('uk')], destination: `/uk${p}`, permanent: false });
      rules.push({ source, has: [header('en')], destination: `/en${p}`, permanent: false });
      rules.push({ source, destination: `/ru${p}`, permanent: false }); // по умолчанию — русский
    }
    return rules;
  },
};
export default nextConfig;
