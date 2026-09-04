-- ROVEXO Super Admin — enum value only.
-- Must commit before 20250703000001 uses 'super_admin'
-- in functions/policies.
-- PostgreSQL SQLSTATE 55P04: a newly added enum value cannot
-- be used in the same transaction as ALTER TYPE ... ADD VALUE.

ALTER TYPE public.user_role
ADD VALUE IF NOT EXISTS 'super_admin';
