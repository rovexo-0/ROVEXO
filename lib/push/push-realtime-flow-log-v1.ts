/**
 * TEMP P0 — Push + Realtime live flow probe.
 * Prefix: [ROVEXO][PUSH_RT_FLOW]
 * Remove after Owner Live Certification PASS.
 */

export const PUSH_RT_FLOW_LOG_PREFIX = "[ROVEXO][PUSH_RT_FLOW]" as const;

export type PushRtFlowEvent =
  | "SUBSCRIBE_OK"
  | "EVENT_CREATED"
  | "NOTIFICATION_CREATED"
  | "DELIVERY_START"
  | "DELIVERY_SUCCESS"
  | "DELIVERY_FAILED"
  | "WEBPUSH_RESPONSE"
  | "APPLE_RESPONSE"
  | "REALTIME_EVENT_SENT"
  | "REALTIME_EVENT_RECEIVED"
  | "UI_UPDATED"
  | "SKIP_PUSH"
  | "SKIP_SILENT_LEGACY";

export function logPushRtFlow(
  event: PushRtFlowEvent | string,
  detail?: Record<string, unknown>,
): void {
  try {
    // eslint-disable-next-line no-console -- TEMP P0 live repair probe
    console.info(PUSH_RT_FLOW_LOG_PREFIX, event, detail ?? {});
  } catch {
    // ignore
  }
}
