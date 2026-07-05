import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordStaffActivity } from "@/lib/staff-profile/service";
import type { StaffActionContext } from "@/lib/staff-profile/types";

export async function listStaffChannels(staffId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("staff_channel_members" as never)
    .select("channel_id, staff_channels(id, slug, name, channel_type, created_at)")
    .eq("staff_id", staffId);

  return (data ?? []) as Array<{
    channel_id: string;
    staff_channels: {
      id: string;
      slug: string;
      name: string;
      channel_type: string;
      created_at: string;
    } | null;
  }>;
}

export async function sendStaffMessage(input: {
  staffId: string;
  channelId: string;
  body: string;
  context: StaffActionContext;
}): Promise<{ id: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("staff_messages" as never)
    .insert({
      channel_id: input.channelId,
      sender_staff_id: input.staffId,
      body: input.body.trim(),
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to send message.");
  }

  await recordStaffActivity({
    staffId: input.staffId,
    actorId: input.context.actorId,
    module: "messaging",
    action: "Message Sent",
    context: input.context,
    metadata: { channelId: input.channelId },
  });

  return { id: (data as { id: string }).id };
}

export async function listStaffChannelMessages(channelId: string, limit = 50, offset = 0) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("staff_messages" as never)
    .select("id, sender_staff_id, body, created_at, edited_at, deleted_at")
    .eq("channel_id", channelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as Array<{
    id: string;
    sender_staff_id: string;
    body: string;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
  }>;
}

export async function ensureDirectStaffChannel(
  staffA: string,
  staffB: string,
  createdBy: string,
): Promise<string> {
  const slug = ["direct", staffA, staffB].sort().join("-");
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("staff_channels" as never)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const existingRow = existing as { id: string } | null;
  if (existingRow?.id) {
    return existingRow.id;
  }

  const { data: channel, error } = await admin
    .from("staff_channels" as never)
    .insert({
      slug,
      name: "Direct Message",
      channel_type: "direct",
      created_by: createdBy,
    } as never)
    .select("id")
    .single();

  if (error || !channel) {
    throw new Error(error?.message ?? "Failed to create channel.");
  }

  const channelId = (channel as { id: string }).id;
  await admin.from("staff_channel_members" as never).upsert(
    [
      { channel_id: channelId, staff_id: staffA },
      { channel_id: channelId, staff_id: staffB },
    ] as never,
    { onConflict: "channel_id,staff_id" },
  );

  return channelId;
}
