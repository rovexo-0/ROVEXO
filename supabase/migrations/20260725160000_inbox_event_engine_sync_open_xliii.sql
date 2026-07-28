-- ROVEXO Absolute Blood Law XLIII
-- Inbox Event Engine — single-transaction conversation open sync
-- Marks conversation unread, peer messages, and all conversation-scoped
-- notifications READ in ONE Postgres transaction. FAIL CLOSED.

create or replace function public.sync_conversation_open_v1(
  p_conversation_id uuid,
  p_viewer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_href_exact text;
  v_href_prefix text;
  v_messages_marked integer := 0;
  v_notifications_marked integer := 0;
  v_viewer_unread_before integer := 0;
  v_now timestamptz := now();
begin
  if p_conversation_id is null or p_viewer_id is null then
    raise exception 'INBOX_SYNC_INVALID_INPUT';
  end if;

  select buyer_id, seller_id
    into v_buyer_id, v_seller_id
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'INBOX_SYNC_CONVERSATION_NOT_FOUND';
  end if;

  if p_viewer_id is distinct from v_buyer_id and p_viewer_id is distinct from v_seller_id then
    raise exception 'INBOX_SYNC_PERMISSION_DENIED';
  end if;

  if p_viewer_id = v_buyer_id then
    select buyer_unread_count into v_viewer_unread_before
    from public.conversations where id = p_conversation_id;
    update public.conversations
      set buyer_unread_count = 0
    where id = p_conversation_id;
  else
    select seller_unread_count into v_viewer_unread_before
    from public.conversations where id = p_conversation_id;
    update public.conversations
      set seller_unread_count = 0
    where id = p_conversation_id;
  end if;

  with updated as (
    update public.messages
      set status = 'read'
    where conversation_id = p_conversation_id
      and sender_id is distinct from p_viewer_id
      and status is distinct from 'read'
    returning id
  )
  select count(*)::integer into v_messages_marked from updated;

  v_href_exact := '/inbox/conversation/' || p_conversation_id::text;
  v_href_prefix := v_href_exact || '?';

  with updated as (
    update public.notifications
      set read = true
    where user_id = p_viewer_id
      and read = false
      and (
        href = v_href_exact
        or href like v_href_prefix || '%'
        or group_key like '%' || p_conversation_id::text || '%'
      )
    returning id
  )
  select count(*)::integer into v_notifications_marked from updated;

  insert into public.user_presence (user_id, online, last_seen_at, typing_conversation_id)
  values (p_viewer_id, true, v_now, null)
  on conflict (user_id) do update
    set online = true,
        last_seen_at = excluded.last_seen_at;

  return jsonb_build_object(
    'ok', true,
    'bloodLaw', 'XLIII',
    'conversationId', p_conversation_id,
    'viewerId', p_viewer_id,
    'viewerUnreadBefore', coalesce(v_viewer_unread_before, 0),
    'messagesMarkedRead', coalesce(v_messages_marked, 0),
    'notificationsMarkedRead', coalesce(v_notifications_marked, 0),
    'syncedAt', v_now
  );
end;
$$;

revoke all on function public.sync_conversation_open_v1(uuid, uuid) from public;
grant execute on function public.sync_conversation_open_v1(uuid, uuid) to authenticated;
grant execute on function public.sync_conversation_open_v1(uuid, uuid) to service_role;
