import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordStaffActivity } from "@/lib/staff-profile/service";
import { sendStaffMessage as sendStaffMessageBase } from "@/lib/staff-enterprise/messaging";
import type { StaffActionContext } from "@/lib/staff-profile/types";
import { sendPushNotification } from "@/lib/push/service";
import { sendStaffNativePush } from "@/lib/staff-comms/push-native";

function admin() {
  return createAdminClient();
}

export async function sendStaffMessageEnhanced(input: {
  staffId: string;
  channelId: string;
  body: string;
  messageType?: string;
  mentionStaffIds?: string[];
  context: StaffActionContext;
}): Promise<{ id: string }> {
  const adminClient = admin();
  const { data, error } = await adminClient
    .from("staff_messages" as never)
    .insert({
      channel_id: input.channelId,
      sender_staff_id: input.staffId,
      body: input.body.trim(),
      message_type: input.messageType ?? "text",
      mention_staff_ids: input.mentionStaffIds ?? [],
    } as never)
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to send message.");

  await recordStaffActivity({
    staffId: input.staffId,
    actorId: input.context.actorId,
    module: "messaging",
    action: "Message Sent",
    context: input.context,
    metadata: { channelId: input.channelId },
  });

  await notifyChannelMembers(input.channelId, input.staffId, input.body, input.mentionStaffIds);

  return { id: (data as { id: string }).id };
}

async function notifyChannelMembers(
  channelId: string,
  senderStaffId: string,
  body: string,
  mentionStaffIds?: string[],
): Promise<void> {
  const { data: members } = await admin()
    .from("staff_channel_members" as never)
    .select("staff_id, staff_profiles(profile_id)")
    .eq("channel_id", channelId);

  for (const member of (members ?? []) as Array<{
    staff_id: string;
    staff_profiles: { profile_id: string | null } | null;
  }>) {
    if (member.staff_id === senderStaffId) continue;
    if (mentionStaffIds?.length && !mentionStaffIds.includes(member.staff_id)) continue;
    const profileId = member.staff_profiles?.profile_id;
    if (!profileId) continue;
    await sendPushNotification(profileId, {
      title: "ROVEXO Staff",
      body: body.slice(0, 140),
      href: "/staff/messages",
      eventType: "staff_message",
      priority: mentionStaffIds?.length ? "high" : "normal",
    });
    await sendStaffNativePush(profileId, {
      title: "ROVEXO Staff",
      body: body.slice(0, 140),
      href: "/staff/messages",
      eventType: "staff_message",
      priority: mentionStaffIds?.length ? "high" : "normal",
    });
  }
}

export async function markStaffMessageRead(messageId: string, staffId: string): Promise<void> {
  await admin().from("staff_message_reads" as never).upsert(
    { message_id: messageId, staff_id: staffId, read_at: new Date().toISOString() } as never,
    { onConflict: "message_id,staff_id" },
  );
}

export async function setStaffTyping(channelId: string, staffId: string, typing: boolean): Promise<void> {
  if (!typing) {
    await admin().from("staff_message_typing" as never).delete().eq("channel_id", channelId).eq("staff_id", staffId);
    return;
  }
  await admin().from("staff_message_typing" as never).upsert(
    {
      channel_id: channelId,
      staff_id: staffId,
      expires_at: new Date(Date.now() + 8_000).toISOString(),
    } as never,
    { onConflict: "channel_id,staff_id" },
  );
}

export async function listStaffTyping(channelId: string, excludeStaffId: string) {
  const { data } = await admin()
    .from("staff_message_typing" as never)
    .select("staff_id, expires_at, staff_profiles(first_name, last_name)")
    .eq("channel_id", channelId)
    .gt("expires_at", new Date().toISOString());

  return ((data ?? []) as Array<Record<string, unknown>>).filter(
    (row) => row.staff_id !== excludeStaffId,
  );
}

export async function pinStaffMessage(
  channelId: string,
  messageId: string,
  pinnedBy: string,
  context: StaffActionContext,
): Promise<void> {
  await admin().from("staff_message_pins" as never).upsert(
    { channel_id: channelId, message_id: messageId, pinned_by: pinnedBy, pinned_at: new Date().toISOString() } as never,
    { onConflict: "channel_id,message_id" },
  );

  await recordStaffActivity({
    staffId: context.actorId,
    actorId: context.actorId,
    module: "messaging",
    action: "Message Pinned",
    context,
    metadata: { channelId, messageId },
  });
}

export async function bookmarkStaffMessage(staffId: string, messageId: string): Promise<void> {
  await admin().from("staff_message_bookmarks" as never).upsert(
    { staff_id: staffId, message_id: messageId } as never,
    { onConflict: "staff_id,message_id" },
  );
}

export async function searchStaffMessages(staffId: string, query: string, limit = 40) {
  const { data: memberships } = await admin()
    .from("staff_channel_members" as never)
    .select("channel_id")
    .eq("staff_id", staffId);

  const channelIds = ((memberships ?? []) as Array<{ channel_id: string }>).map((m) => m.channel_id);
  if (!channelIds.length) return [];

  const { data } = await admin()
    .from("staff_messages" as never)
    .select("id, channel_id, body, created_at, sender_staff_id")
    .in("channel_id", channelIds)
    .ilike("body", `%${query.trim()}%`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function createDepartmentChannel(
  departmentId: string,
  createdBy: string,
  context: StaffActionContext,
): Promise<string> {
  const slug = `department-${departmentId}`;
  const adminClient = admin();
  const { data: existing } = await adminClient
    .from("staff_channels" as never)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const existingId = (existing as { id: string } | null)?.id;
  if (existingId) return existingId;

  const { data: channel, error: channelError } = await adminClient
    .from("staff_channels" as never)
    .insert({
      slug,
      name: `${departmentId} Department`,
      channel_type: "department",
      department_id: departmentId,
      created_by: createdBy,
    } as never)
    .select("id")
    .single();

  if (channelError || !channel) throw new Error(channelError?.message ?? "Failed to create department channel.");

  const channelId = (channel as { id: string }).id;

  const { data: members } = await adminClient
    .from("staff_member_departments" as never)
    .select("staff_id")
    .eq("department_id", departmentId);

  const rows = ((members ?? []) as Array<{ staff_id: string }>).map((m) => ({
    channel_id: channelId,
    staff_id: m.staff_id,
  }));

  if (rows.length) {
    await adminClient.from("staff_channel_members" as never).upsert(rows as never, {
      onConflict: "channel_id,staff_id",
    });
  }

  await recordStaffActivity({
    staffId: context.actorId,
    actorId: context.actorId,
    module: "messaging",
    action: "Department Channel Created",
    context,
    metadata: { departmentId, channelId },
  });

  return channelId;
}

// Re-export base for compatibility
export { sendStaffMessageBase as sendStaffMessage };
