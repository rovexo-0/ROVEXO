-- Expand marketplace categories for Phase 1

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Property', 'property', null, 'Property', 11
where not exists (select 1 from public.categories where slug = 'property' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'DIY', 'diy', null, 'DIY', 12
where not exists (select 1 from public.categories where slug = 'diy' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Tools', 'tools', null, 'Tools', 13
where not exists (select 1 from public.categories where slug = 'tools' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Health', 'health', null, 'Health', 14
where not exists (select 1 from public.categories where slug = 'health' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Baby & Kids', 'baby-kids', null, 'Baby & Kids', 15
where not exists (select 1 from public.categories where slug = 'baby-kids' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Music', 'music', null, 'Music', 16
where not exists (select 1 from public.categories where slug = 'music' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Movies', 'movies', null, 'Movies', 17
where not exists (select 1 from public.categories where slug = 'movies' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Gaming', 'gaming', null, 'Gaming', 18
where not exists (select 1 from public.categories where slug = 'gaming' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Business', 'business', null, 'Business', 19
where not exists (select 1 from public.categories where slug = 'business' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Jobs', 'jobs', null, 'Jobs', 20
where not exists (select 1 from public.categories where slug = 'jobs' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Services', 'services', null, 'Services', 21
where not exists (select 1 from public.categories where slug = 'services' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Tickets', 'tickets', null, 'Tickets', 22
where not exists (select 1 from public.categories where slug = 'tickets' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Food', 'food', null, 'Food', 23
where not exists (select 1 from public.categories where slug = 'food' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Office', 'office', null, 'Office', 24
where not exists (select 1 from public.categories where slug = 'office' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Industrial', 'industrial', null, 'Industrial', 25
where not exists (select 1 from public.categories where slug = 'industrial' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Agriculture', 'agriculture', null, 'Agriculture', 26
where not exists (select 1 from public.categories where slug = 'agriculture' and parent_id is null);

-- Home & Garden deep tree
insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Furniture', 'furniture', c.id, 'Home & Garden > Furniture', 1
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Bedding', 'bedding', c.id, 'Home & Garden > Bedding', 2
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Kitchen', 'kitchen', c.id, 'Home & Garden > Kitchen', 3
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Bathroom', 'bathroom', c.id, 'Home & Garden > Bathroom', 4
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Garden', 'garden', c.id, 'Home & Garden > Garden', 5
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Lighting', 'lighting', c.id, 'Home & Garden > Lighting', 6
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Decor', 'decor', c.id, 'Home & Garden > Decor', 7
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Storage', 'storage', c.id, 'Home & Garden > Storage', 8
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

insert into public.categories (name, slug, parent_id, path_label, sort_order)
select 'Cleaning', 'cleaning', c.id, 'Home & Garden > Cleaning', 9
from public.categories c
where c.slug = 'home-garden' and c.parent_id is null
on conflict (slug, parent_id) do nothing;

-- Furniture leaves
insert into public.categories (name, slug, parent_id, path_label, sort_order)
select v.name, v.slug, p.id, 'Home & Garden > Furniture > ' || v.name, v.sort_order
from public.categories p
cross join (
  values
    ('Beds', 'beds', 1),
    ('Mattresses', 'mattresses', 2),
    ('Bed Frames', 'bed-frames', 3),
    ('Bedside Tables', 'bedside-tables', 4),
    ('Wardrobes', 'wardrobes', 5),
    ('Drawers', 'drawers', 6),
    ('Sofas', 'sofas', 7),
    ('Chairs', 'chairs', 8),
    ('Dining Tables', 'dining-tables', 9),
    ('Coffee Tables', 'coffee-tables', 10),
    ('TV Units', 'tv-units', 11),
    ('Office Furniture', 'office-furniture', 12)
) as v(name, slug, sort_order)
where p.slug = 'furniture'
  and p.parent_id = (select id from public.categories where slug = 'home-garden' and parent_id is null limit 1)
on conflict (slug, parent_id) do nothing;

-- Bedding leaves
insert into public.categories (name, slug, parent_id, path_label, sort_order)
select v.name, v.slug, p.id, 'Home & Garden > Bedding > ' || v.name, v.sort_order
from public.categories p
cross join (
  values
    ('Bed Sheets', 'bed-sheets', 1),
    ('Duvet Covers', 'duvet-covers', 2),
    ('Pillows', 'pillows', 3),
    ('Pillow Cases', 'pillow-cases', 4),
    ('Duvets', 'duvets', 5),
    ('Mattress Protectors', 'mattress-protectors', 6),
    ('Blankets', 'blankets', 7),
    ('Throws', 'throws', 8)
) as v(name, slug, sort_order)
where p.slug = 'bedding'
  and p.parent_id = (select id from public.categories where slug = 'home-garden' and parent_id is null limit 1)
on conflict (slug, parent_id) do nothing;
