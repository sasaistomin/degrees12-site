-- ============================================================
-- supabase/migration-orders.sql — КОРЗИНА И ЗАКАЗЫ
-- Supabase → SQL Editor → вставить целиком → Run. Можно запускать повторно.
-- Нужно выполнить ПОСЛЕ migration.sql.
-- ============================================================

-- Вещь можно «зарезервировать», пока заказ не выполнен или не отменён
alter table public.products add column if not exists reserved boolean not null default false;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','confirmed','shipped','done','cancelled')),
  name text not null, phone text not null, city text, delivery text, address text, payment text, comment text, locale text,
  total numeric not null default 0,
  secret uuid not null default gen_random_uuid(),   -- знает только покупатель; нужен для уведомления в Telegram
  notified boolean not null default false
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null, size text, price numeric not null, cost numeric, photo text   -- «снимок» товара на момент заказа
);

-- Заказы читает и меняет только админ. Покупатели создают их ТОЛЬКО через функцию place_order (ниже).
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "orders admin" on public.orders;
drop policy if exists "order_items admin" on public.order_items;
create policy "orders admin" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "order_items admin" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- Оформление заказа. Цены и наличие берутся из базы, а не от покупателя, поэтому подделать их нельзя.
create or replace function public.place_order(
  p_name text, p_phone text, p_city text, p_delivery text, p_address text,
  p_payment text, p_comment text, p_locale text, p_items jsonb
) returns json language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_prod public.products; v_total numeric := 0; it jsonb;
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(p_name) > 100 then raise exception 'bad_name'; end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) not between 9 and 15 then raise exception 'bad_phone'; end if;
  if p_delivery not in ('nova_poshta', 'ukrposhta', 'pickup') then raise exception 'bad_delivery'; end if;
  if p_payment not in ('cod', 'card') then raise exception 'bad_payment'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'bad_items'; end if;

  insert into public.orders (name, phone, city, delivery, address, payment, comment, locale)
  values (left(trim(p_name), 100), left(trim(p_phone), 30), left(coalesce(p_city, ''), 100), p_delivery,
          left(coalesce(p_address, ''), 300), p_payment, left(coalesce(p_comment, ''), 1000), left(coalesce(p_locale, ''), 5))
  returning * into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into v_prod from public.products where id = (it->>'id')::uuid for update;
    if not found or v_prod.hidden or v_prod.sold or v_prod.reserved then
      raise exception 'unavailable:%', coalesce(v_prod.name, '?');
    end if;
    insert into public.order_items (order_id, product_id, name, size, price, cost, photo)
    values (v_order.id, v_prod.id, v_prod.name, nullif(left(coalesce(it->>'size', ''), 20), ''), v_prod.price, v_prod.cost,
            coalesce(v_prod.photos[1], v_prod.photo));
    update public.products set reserved = true where id = v_prod.id;
    v_total := v_total + v_prod.price;
  end loop;

  update public.orders set total = v_total where id = v_order.id;
  return json_build_object('id', v_order.id, 'number', v_order.number, 'total', v_total, 'secret', v_order.secret);
end $$;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- Смена статуса заказа (только админ). Заодно обновляет товары:
-- «выполнен» -> проданы (попадают в график доходов); «отменён» -> снова в продаже; остальные статусы -> в резерве.
create or replace function public.set_order_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_prev text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('new', 'confirmed', 'shipped', 'done', 'cancelled') then raise exception 'bad_status'; end if;
  select status into v_prev from public.orders where id = p_id;
  update public.orders set status = p_status where id = p_id;
  if p_status = 'done' then
    update public.products set sold = true, sold_at = coalesce(sold_at, now()), reserved = false
    where id in (select product_id from public.order_items where order_id = p_id);
  elsif p_status = 'cancelled' then
    update public.products set reserved = false, sold = false, sold_at = null
    where id in (select product_id from public.order_items where order_id = p_id);
  else
    update public.products set reserved = true, sold = false, sold_at = null
    where id in (select product_id from public.order_items where order_id = p_id);
  end if;
end $$;
grant execute on function public.set_order_status(uuid, text) to authenticated;

-- Данные заказа для уведомления в Telegram: отдаются один раз и только тому, кто знает secret
create or replace function public.order_for_notify(p_id uuid, p_secret uuid)
returns json language plpgsql security definer set search_path = public as $$
declare o public.orders; items json;
begin
  update public.orders set notified = true where id = p_id and secret = p_secret and notified = false returning * into o;
  if o.id is null then return null; end if;
  select json_agg(json_build_object('name', name, 'size', size, 'price', price)) into items from public.order_items where order_id = o.id;
  return json_build_object('number', o.number, 'name', o.name, 'phone', o.phone, 'city', o.city, 'delivery', o.delivery,
                           'address', o.address, 'payment', o.payment, 'comment', o.comment, 'total', o.total, 'items', items);
end $$;
grant execute on function public.order_for_notify(uuid, uuid) to anon, authenticated;
