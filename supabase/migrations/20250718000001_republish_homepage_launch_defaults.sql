-- Republish ROVEXO launch homepage defaults in Mission Control.
-- Disables hero-slider / business-spotlight and ensures bring-items stays published.

update public.platform_settings
set
  value = jsonb_set(
    value,
    '{components}',
    (
      select coalesce(
        jsonb_agg(
          case
            when component->>'id' in ('hero-slider', 'business-spotlight') then
              component
              || jsonb_build_object('enabled', false, 'published', false)
              || jsonb_build_object(
                'visibility',
                jsonb_build_object('desktop', false, 'tablet', false, 'mobile', false)
              )
            when component->>'id' = 'bring-items' then
              component
              || jsonb_build_object('enabled', true, 'published', true)
            when component->>'id' = 'top-category-bar' then
              component
              || jsonb_build_object('enabled', true, 'published', true)
            else component
          end
          order by (component->>'order')::int nulls last
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(value->'components') as component
    ),
    true
  ),
  updated_at = now()
where key = 'mission_control_homepage_builder_v1'
  and jsonb_typeof(value->'components') = 'array';

-- Keep visual draft bundle aligned when a stored draft exists.
update public.platform_settings as draft
set
  value = jsonb_set(
    draft.value,
    '{homepageBuilder}',
    live.value,
    true
  ),
  updated_at = now()
from public.platform_settings as live
where draft.key = 'platform_visual_draft_v1'
  and live.key = 'mission_control_homepage_builder_v1'
  and jsonb_typeof(draft.value) = 'object'
  and jsonb_typeof(live.value) = 'object';
