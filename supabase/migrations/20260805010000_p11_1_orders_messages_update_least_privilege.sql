/**
 * P11.1 — Orders UPDATE least privilege (C-02).
 * Participants no longer have unrestricted UPDATE on orders.
 * Order status/money mutations must go through service_role (admin client)
 * after application-layer authorization.
 *
 * Messages UPDATE: sender-only (or admin) — prevents participants from
 * rewriting other parties' message rows (H-03 related).
 */

-- ---------------------------------------------------------------------------
-- orders: revoke participant UPDATE; admin-only under RLS
-- (service_role bypasses RLS for Commerce Engine / store admin client)
-- ---------------------------------------------------------------------------
drop policy if exists "orders_update_participant" on public.orders;

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- messages: only sender (or admin) may UPDATE their own rows
-- ---------------------------------------------------------------------------
drop policy if exists "messages_update_participant" on public.messages;

drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender"
  on public.messages for update
  using (sender_id = auth.uid() or public.is_admin())
  with check (sender_id = auth.uid() or public.is_admin());
