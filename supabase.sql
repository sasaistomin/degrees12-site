-- ============================================================
-- supabase.sql — вставьте целиком в Supabase → SQL Editor → Run
-- Админ-вход: логин «Istomin Sasha M» (внутри это istomin.sasha.m@degrees12.shop)
-- ============================================================
create or replace function public.is_admin() returns boolean
language sql stable as $$ select coalesce(auth.jwt()->>'email','') = 'istomin.sasha.m@degrees12.shop' $$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text not null default '#4a3223',
  text_color text not null default '#f6efe3',
  position int not null default 0
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  sizes text[] not null default '{}',
  price numeric not null default 0,
  photo text,
  sold boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Права: читать все (скрытые товары — только админ), менять — только админ
alter table public.categories enable row level security;
alter table public.products enable row level security;
create policy "cat read"   on public.categories for select using (true);
create policy "cat write"  on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "prod read"  on public.products for select using (hidden = false or public.is_admin());
create policy "prod write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Хранилище фото: читать все, загружать только админ
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;
create policy "photos write"  on storage.objects for insert with check (bucket_id = 'photos' and public.is_admin());
create policy "photos update" on storage.objects for update using (bucket_id = 'photos' and public.is_admin());
create policy "photos delete" on storage.objects for delete using (bucket_id = 'photos' and public.is_admin());

-- Ваши текущие категории и товары из products.js (фото берутся из папки photos сайта)
insert into public.categories (name, color, text_color, position) values
  ('Куртки', '#4a3223', '#f6efe3', 1), ('Худи и свитшоты', '#b8946a', '#24160e', 2), ('Футболки', '#e9dcc6', '#24160e', 3),
  ('Брюки и джинсы', '#6f4e37', '#f6efe3', 4), ('Аксессуары', '#24160e', '#e9dcc6', 5)
on conflict do nothing;
insert into public.products (name, category, sizes, price, photo) values
  ('Maison Margiela Caution', 'Футболки', array['S','M','L','XL'], 7500, 'photos/Maison-Margiela-Caution.png'),
  ('Maison Margiela «Hands»', 'Футболки', array['S','M','L','XL'], 1200, 'photos/Maison-Margiela-Hands.png'),
  ('Кожаная куртка 90-х', 'Куртки', array['M'], 4200, null),
  ('Вельветовый бомбер', 'Куртки', array['L'], 3100, null),
  ('Стёганая куртка', 'Куртки', array['L'], 3600, null),
  ('Худи Archive', 'Худи и свитшоты', array['XL'], 1900, null),
  ('Свитшот Vintage', 'Худи и свитшоты', array['M'], 1500, null),
  ('Флисовая кофта', 'Худи и свитшоты', array['L'], 1700, null),
  ('Джинсы Straight', 'Брюки и джинсы', array['32'], 2300, null),
  ('Карго Army', 'Брюки и джинсы', array['34'], 2100, null),
  ('Вельветовые брюки', 'Брюки и джинсы', array['30'], 1800, null),
  ('Кепка Wool', 'Аксессуары', array['One size'], 700, null),
  ('Сумка Messenger', 'Аксессуары', array['One size'], 1600, null);
