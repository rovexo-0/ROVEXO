/**
 * Soft Permission Prompt — eligibility + local dismiss state.
 * Never calls Notification.requestPermission — Enable CTA only.
 *
 * Mobile/Desktop identical: if Web Push is supported and permission is undecided,
 * the Soft Permission Sheet must appear (never gated on SW ready).
 */

export const PUSH_SOFT_PROMPT_STORAGE_KEY = "rovexo.push.softPermission.v1" as const;
export const PUSH_SOFT_PROMPT_LATER_MS = 3 * 24 * 60 * 60 * 1000;

export type PushSoftPromptOutcome = "later" | "enabled" | "denied";

export type PushSoftPromptRecord = {
  outcome: PushSoftPromptOutcome;
  at: number;
};

export function readPushSoftPromptRecord(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
): PushSoftPromptRecord | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PUSH_SOFT_PROMPT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PushSoftPromptRecord;
    if (!parsed?.outcome || typeof parsed.at !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePushSoftPromptRecord(
  record: PushSoftPromptRecord,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
): void {
  if (!storage) return;
  try {
    storage.setItem(PUSH_SOFT_PROMPT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore quota / private mode
  }
}

export type SoftPromptEligibilityInput = {
  authenticated: boolean;
  /** Web Push APIs available in this browsing context. */
  pushCapable: boolean;
  osPermission: "default" | "granted" | "denied" | "unsupported";
  record: PushSoftPromptRecord | null;
  nowMs?: number;
  laterCooldownMs?: number;
};

/**
 * Soft sheet shows when:
 * - user authenticated
 * - browser supports Web Push
 * - OS permission still undecided (`default`)
 * - user has not enabled / denied / deferred recently
 */
export function shouldShowPushSoftPermissionPrompt(
  input: SoftPromptEligibilityInput,
): boolean {
  if (!input.authenticated) return false;
  if (!input.pushCapable) return false;
  if (input.osPermission !== "default") return false;

  const record = input.record;
  if (!record) return true;

  if (record.outcome === "enabled" || record.outcome === "denied") {
    return false;
  }

  if (record.outcome === "later") {
    const now = input.nowMs ?? Date.now();
    const cooldown = input.laterCooldownMs ?? PUSH_SOFT_PROMPT_LATER_MS;
    return now - record.at >= cooldown;
  }

  return true;
}

export const PUSH_SOFT_PROMPT_BENEFITS = [
  "Messages",
  "Offers",
  "Orders",
  "Delivery updates",
  "Wallet",
  "Reviews",
] as const;

export const PUSH_SOFT_PROMPT_COPY = {
  title: "Welcome to ROVEXO",
  subtitle: "Stay informed instantly.",
  enableLabel: "Enable Notifications",
  laterLabel: "Maybe Later",
} as const;
