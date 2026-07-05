import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function subscribeStaffMessages(
  channelId: string,
  onInsert: (row: Record<string, unknown>) => void,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  return supabase
    .channel(`staff-messages:${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "staff_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => onInsert(payload.new as Record<string, unknown>),
    )
    .subscribe();
}

export function subscribeStaffTyping(
  channelId: string,
  onChange: () => void,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  return supabase
    .channel(`staff-typing:${channelId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "staff_message_typing", filter: `channel_id=eq.${channelId}` },
      () => onChange(),
    )
    .subscribe();
}

export function subscribeStaffPresence(
  onChange: (row: Record<string, unknown>) => void,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  return supabase
    .channel("staff-presence-all")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "staff_presence" },
      (payload) => onChange((payload.new ?? payload.old) as Record<string, unknown>),
    )
    .subscribe();
}

export function subscribeStaffCallSignals(
  callId: string,
  staffId: string,
  onSignal: (row: Record<string, unknown>) => void,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  return supabase
    .channel(`staff-call:${callId}:${staffId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "staff_call_signals",
        filter: `call_id=eq.${callId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const target = row.target_staff_id as string | null;
        if (!target || target === staffId) {
          onSignal(row);
        }
      },
    )
    .subscribe();
}

export function subscribeStaffCallBroadcast(
  callId: string,
  onPayload: (payload: Record<string, unknown>) => void,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) return null;

  return supabase
    .channel(`staff-call-broadcast:${callId}`)
    .on("broadcast", { event: "signal" }, ({ payload }) => onPayload(payload as Record<string, unknown>))
    .subscribe();
}

export async function broadcastStaffCallSignal(
  callId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = tryCreateClient();
  if (!supabase) return;
  const channel = supabase.channel(`staff-call-broadcast:${callId}`);
  await channel.subscribe();
  await channel.send({ type: "broadcast", event: "signal", payload });
  await supabase.removeChannel(channel);
}

export const STAFF_WEBRTC_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export async function createStaffPeerConnection(): Promise<RTCPeerConnection> {
  return new RTCPeerConnection({ iceServers: STAFF_WEBRTC_ICE_SERVERS });
}
