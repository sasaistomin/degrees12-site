// Вставляет структурированные данные (schema.org) для Google: товары, организация, хлебные крошки
export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
