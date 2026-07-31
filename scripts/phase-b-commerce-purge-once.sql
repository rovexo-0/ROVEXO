-- ROVEXO Phase B FINAL — Owner-only one-shot commerce purge
-- NOT a migration. NOT for agents to auto-run.
--
-- Single blocking mechanism this script addresses:
--   public.commerce_prevent_mutation() via BEFORE UPDATE OR DELETE triggers:
--     commerce_audit_logs_immutable
--     escrow_events_immutable
--     refund_events_immutable
--     shipping_transactions_immutable
--     resolution_events_immutable
--   (orders fail because ON DELETE SET NULL on commerce_audit_logs.order_id
--    attempts UPDATE → same append-only guard)
--
-- Requirements:
--   • one transaction only
--   • rollback on failure (Postgres aborts the transaction; no partial commit)
--   • no schema changes
--   • no permanent trigger DROP/CREATE
--   • session_replication_role is SET LOCAL → restored automatically on COMMIT/ROLLBACK
--
-- Owner: Supabase Dashboard → SQL Editor → Run as database owner / postgres.

begin;

set local session_replication_role = replica;

delete from public.resolution_events;
delete from public.resolution_cases;
delete from public.refund_events;
delete from public.escrow_events;
delete from public.shipping_transactions;
delete from public.shipping_reserve;
delete from public.commerce_audit_logs;
delete from public.orders;

commit;

-- Read-only verification (outside purge transaction)
select 'products' as table_name, count(*)::int as rows from public.products
union all select 'conversations', count(*)::int from public.conversations
union all select 'messages', count(*)::int from public.messages
union all select 'notifications', count(*)::int from public.notifications
union all select 'offers', count(*)::int from public.offers
union all select 'wallet_transactions', count(*)::int from public.wallet_transactions
union all select 'orders', count(*)::int from public.orders
union all select 'resolution_cases', count(*)::int from public.resolution_cases
union all select 'commerce_audit_logs', count(*)::int from public.commerce_audit_logs
union all select 'escrow_events', count(*)::int from public.escrow_events;
