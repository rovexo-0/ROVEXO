-- Seed category tree for ROVEXO marketplace

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Fashion', 'fashion', null, 'Fashion', 1
where not exists (select 1 from public.categories where slug = 'fashion' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Electronics', 'electronics', null, 'Electronics', 2
where not exists (select 1 from public.categories where slug = 'electronics' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Home & Garden', 'home-garden', null, 'Home & Garden', 3
where not exists (select 1 from public.categories where slug = 'home-garden' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Vehicles', 'vehicles', null, 'Vehicles', 4
where not exists (select 1 from public.categories where slug = 'vehicles' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Sports', 'sports', null, 'Sports', 5
where not exists (select 1 from public.categories where slug = 'sports' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Beauty', 'beauty', null, 'Beauty', 6
where not exists (select 1 from public.categories where slug = 'beauty' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Toys', 'toys', null, 'Toys', 7
where not exists (select 1 from public.categories where slug = 'toys' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Books', 'books', null, 'Books', 8
where not exists (select 1 from public.categories where slug = 'books' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Collectibles', 'collectibles', null, 'Collectibles', 9
where not exists (select 1 from public.categories where slug = 'collectibles' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Pets', 'pets', null, 'Pets', 10
where not exists (select 1 from public.categories where slug = 'pets' and parent_id is null);

-- Fashion subcategories
insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Women', 'women', c.id, 'Fashion > Women', 1
from public.categories c
where c.slug = 'fashion' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Men', 'men', c.id, 'Fashion > Men', 2
from public.categories c
where c.slug = 'fashion' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

-- Electronics subcategories
insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Phones', 'phones', c.id, 'Electronics > Phones', 1
from public.categories c
where c.slug = 'electronics' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Computers', 'computers', c.id, 'Electronics > Computers', 2
from public.categories c
where c.slug = 'electronics' and c.parent_id is null
on conflict (slug, parent_id) do nothing;
