import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordStaffActivity } from "@/lib/staff-profile/service";
import type { StaffActionContext } from "@/lib/staff-profile/types";

export type StaffCallType = "voice" | "video" | "conference";

function admin() {
  return createAdminClient();
}

export async function initiateStaffCall(input: {
  initiatorStaffId: string;
  participantStaffIds: string[];
  callType: StaffCallType;
  channelId?: string | null;
  recordingEnabled?: boolean;
  context: StaffActionContext;
}): Promise<{ callId: string }> {
  const { data: call, error } = await admin()
    .from("staff_call_sessions" as never)
    .insert({
      call_type: input.callType,
      status: "ringing",
      initiator_staff_id: input.initiatorStaffId,
      channel_id: input.channelId ?? null,
      recording_enabled: input.recordingEnabled ?? false,
    } as never)
    .select("id")
    .single();

  if (error || !call) throw new Error(error?.message ?? "Failed to initiate call.");

  const callId = (call as { id: string }).id;
  const participants = new Set([input.initiatorStaffId, ...input.participantStaffIds]);

  await admin().from("staff_call_participants" as never).insert(
    [...participants].map((staffId) => ({
      call_id: callId,
      staff_id: staffId,
      is_host: staffId === input.initiatorStaffId,
    })) as never,
  );

  await recordStaffActivity({
    staffId: input.initiatorStaffId,
    actorId: input.context.actorId,
    module: input.callType === "video" || input.callType === "conference" ? "messaging" : "authentication",
    action: `${input.callType === "voice" ? "Voice" : "Video"} Call Started`,
    context: input.context,
    metadata: { callId, participants: [...participants] },
  });

  return { callId };
}

export async function answerStaffCall(callId: string, staffId: string, context: StaffActionContext): Promise<void> {
  const now = new Date().toISOString();
  await admin()
    .from("staff_call_sessions" as never)
    .update({ status: "active", answered_at: now } as never)
    .eq("id", callId);

  await admin()
    .from("staff_call_participants" as never)
    .update({ joined_at: now } as never)
    .eq("call_id", callId)
    .eq("staff_id", staffId);

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "authentication",
    action: "Call Answered",
    context,
    metadata: { callId },
  });
}

export async function endStaffCall(
  callId: string,
  staffId: string,
  reason: string,
  context: StaffActionContext,
): Promise<void> {
  const now = new Date().toISOString();
  await admin()
    .from("staff_call_sessions" as never)
    .update({ status: "ended", ended_at: now, end_reason: reason } as never)
    .eq("id", callId);

  await admin()
    .from("staff_call_participants" as never)
    .update({ left_at: now } as never)
    .eq("call_id", callId);

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "authentication",
    action: "Call Ended",
    context,
    metadata: { callId, reason },
  });
}

export async function declineStaffCall(callId: string, staffId: string, context: StaffActionContext): Promise<void> {
  await admin()
    .from("staff_call_sessions" as never)
    .update({ status: "declined", ended_at: new Date().toISOString() } as never)
    .eq("id", callId);

  await recordStaffActivity({
    staffId,
    actorId: context.actorId,
    module: "authentication",
    action: "Call Declined",
    context,
    metadata: { callId },
  });
}

export async function markStaffCallMissed(callId: string): Promise<void> {
  await admin()
    .from("staff_call_sessions" as never)
    .update({ status: "missed", ended_at: new Date().toISOString() } as never)
    .eq("id", callId)
    .eq("status", "ringing");
}

export async function transferStaffCall(input: {
  callId: string;
  fromStaffId: string;
  toStaffId: string;
  context: StaffActionContext;
}): Promise<void> {
  await admin().from("staff_call_participants" as never).upsert(
    {
      call_id: input.callId,
      staff_id: input.toStaffId,
      joined_at: new Date().toISOString(),
    } as never,
    { onConflict: "call_id,staff_id" },
  );

  await recordStaffActivity({
    staffId: input.fromStaffId,
    actorId: input.context.actorId,
    module: "authentication",
    action: "Call Transferred",
    context: input.context,
    metadata: { callId: input.callId, toStaffId: input.toStaffId },
  });
}

export async function persistStaffCallSignal(input: {
  callId: string;
  senderStaffId: string;
  targetStaffId?: string | null;
  signalType: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  await admin().from("staff_call_signals" as never).insert({
    call_id: input.callId,
    sender_staff_id: input.senderStaffId,
    target_staff_id: input.targetStaffId ?? null,
    signal_type: input.signalType,
    payload: input.payload,
  } as never);
}

export async function listStaffCallHistory(staffId: string, limit = 50) {
  const { data } = await admin()
    .from("staff_call_participants" as never)
    .select("call_id, joined_at, left_at, staff_call_sessions(id, call_type, status, started_at, ended_at, end_reason)")
    .eq("staff_id", staffId)
    .order("joined_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  return data ?? [];
}

export async function updateCallParticipantMedia(input: {
  callId: string;
  staffId: string;
  muted?: boolean;
  videoEnabled?: boolean;
  speakerEnabled?: boolean;
}): Promise<void> {
  const patch: Record<string, boolean> = {};
  if (input.muted !== undefined) patch.muted = input.muted;
  if (input.videoEnabled !== undefined) patch.video_enabled = input.videoEnabled;
  if (input.speakerEnabled !== undefined) patch.speaker_enabled = input.speakerEnabled;
  if (!Object.keys(patch).length) return;

  await admin()
    .from("staff_call_participants" as never)
    .update(patch as never)
    .eq("call_id", input.callId)
    .eq("staff_id", input.staffId);
}
