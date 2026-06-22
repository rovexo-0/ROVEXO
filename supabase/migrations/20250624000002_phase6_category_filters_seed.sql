-- Phase 6B: Seed category filter definitions for top-level categories

insert into public.category_filter_definitions (category_id, filter_key, label, filter_type, options, sort_order, is_required)
select c.id, 'condition', 'Condition', 'select', '["New","Like New","Good","Fair","For Parts"]'::jsonb, 0, false
from public.categories c
where c.parent_id is null
on conflict (category_id, filter_key) do nothing;

insert into public.category_filter_definitions (category_id, filter_key, label, filter_type, options, sort_order, is_required)
select c.id, 'price', 'Price', 'range', '[]'::jsonb, 1, false
from public.categories c
where c.parent_id is null
on conflict (category_id, filter_key) do nothing;

insert into public.category_filter_definitions (category_id, filter_key, label, filter_type, options, sort_order, is_required)
select c.id, 'make', 'Make', 'text', '[]'::jsonb, 2, true
from public.categories c
where c.slug = 'vehicles' and c.parent_id is null
on conflict (category_id, filter_key) do nothing;

insert into public.category_filter_definitions (category_id, filter_key, label, filter_type, options, sort_order, is_required)
select c.id, 'model', 'Model', 'text', '[]'::jsonb, 3, true
from public.categories c
where c.slug = 'vehicles' and c.parent_id is null
on conflict (category_id, filter_key) do nothing;

insert into public.category_filter_definitions (category_id, filter_key, label, filter_type, options, sort_order, is_required)
select c.id, 'size', 'Size', 'select', '["XS","S","M","L","XL","XXL"]'::jsonb, 2, false
from public.categories c
where c.slug = 'fashion' and c.parent_id is null
on conflict (category_id, filter_key) do nothing;

insert into public.category_filter_definitions (category_id, filter_key, label, filter_type, options, sort_order, is_required)
select c.id, 'platform', 'Platform', 'select', '["PlayStation","Xbox","Nintendo","PC"]'::jsonb, 2, false
from public.categories c
where c.slug = 'gaming' and c.parent_id is null
on conflict (category_id, filter_key) do nothing;
