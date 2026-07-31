-- ROVEXO HMRC Production Lock — profiles.date_of_birth
-- Account-level DOB for Personal Information + HMRC prefill.

alter table public.profiles
  add column if not exists date_of_birth date;

comment on column public.profiles.date_of_birth is
  'UK account date of birth (ISO date). Used by Personal Information and HMRC Reporting Centre.';
