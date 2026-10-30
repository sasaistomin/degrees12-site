-- ============================================================
-- supabase/migration.sql — ОБНОВЛЕНИЕ БАЗЫ под новую версию сайта
-- Вставьте целиком в Supabase → SQL Editor → Run. Можно запускать повторно (ничего не сломается).
-- Старые товары и категории остаются как были.
-- ============================================================

-- 1) Новые поля у товаров
alter table public.products add column if not exists brand text;          -- бренд
alter table public.products add column if not exists description text;    -- описание для Google и покупателей
alter table public.products add column if not exists cost numeric;        -- себестоимость (закупка) для расчёта прибыли
alter table public.products add column if not exists source_url text;     -- ссылка на товар в магазине-источнике
alter table public.products add column if not exists source_store text;   -- домен магазина-источника
alter table public.products add column if not exists sold_at timestamptz; -- когда продано (для графика доходов)
update public.products set sold_at = created_at where sold and sold_at is null;

-- 2) Счётчик посещений (анонимный): записывать может любой посетитель, читать — только админ
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  locale text,
  visitor_id text,
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at);
alter table public.page_views enable row level security;
drop policy if exists "views insert" on public.page_views;
drop policy if exists "views read" on public.page_views;
create policy "views insert" on public.page_views for insert to anon, authenticated with check (char_length(path) <= 300);
create policy "views read" on public.page_views for select using (public.is_admin());

-- 3) Функции для графиков в админке
create or replace function public.daily_views(days int)
returns table(day date, views bigint, visitors bigint)
language sql stable as $$
  select (created_at at time zone 'UTC')::date, count(*), count(distinct visitor_id)
  from public.page_views
  where created_at >= now() - make_interval(days => days)
  group by 1 order by 1
$$;

create or replace function public.top_pages(days int)
returns table(path text, views bigint)
language sql stable as $$
  select path, count(*) from public.page_views
  where created_at >= now() - make_interval(days => days)
  group by path order by count(*) desc limit 10
$$;
