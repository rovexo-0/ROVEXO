import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendStaffMessageEnhanced } from "@/lib/staff-comms/messages";
import { persistStaffCallSignal } from "@/lib/staff-comms/calls";
import type { StaffActionContext } from "@/lib/staff-profile/types";

function admin() {
  return createAdminClient();
}

export async function queueStaffOfflineAction(input: {
  staffId: string;
  actionType: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await admin()
    .from("staff_offline_queue" as never)
    .insert({
      staff_id: input.staffId,
      action_type: input.actionType,
      payload: input.payload,
    } as never)
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to queue offline action.");
  return (data as { id: string }).id;
}

export async function syncStaffOfflineQueue(
  staffId: string,
  context: StaffActionContext,
): Promise<{ synced: number; failed: number }> {
  const { data: pending } = await admin()
    .from("staff_offline_queue" as never)
    .select("id, action_type, payload")
    .eq("staff_id", staffId)
    .is("synced_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  let synced = 0;
  let failed = 0;

  for (const row of (pending ?? []) as Array<{
    id: string;
    action_type: string;
    payload: Record<string, unknown>;
  }>) {
    try {
      if (row.action_type === "send_message") {
        await sendStaffMessageEnhanced({
          staffId,
          channelId: String(row.payload.channelId),
          body: String(row.payload.body),
          messageType: row.payload.messageType ? String(row.payload.messageType) : undefined,
          context,
        });
      } else if (row.action_type === "call_signal") {
        await persistStaffCallSignal({
          callId: String(row.payload.callId),
          senderStaffId: staffId,
          targetStaffId: row.payload.targetStaffId ? String(row.payload.targetStaffId) : null,
          signalType: String(row.payload.signalType),
          payload: (row.payload.signalPayload as Record<string, unknown>) ?? {},
        });
      }

      await admin()
        .from("staff_offline_queue" as never)
        .update({ synced_at: new Date().toISOString() } as never)
        .eq("id", row.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}

export async function cacheStaffDirectorySnapshot(staffId: string): Promise<Record<string, unknown>> {
  const { listStaffDirectory } = await import("@/lib/staff-enterprise/directory");
  const directory = await listStaffDirectory(200);
  return { staffId, cachedAt: new Date().toISOString(), directory };
}
