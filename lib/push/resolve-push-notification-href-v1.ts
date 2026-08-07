/**
 * Push deep-link resolver — Phase 1.
 * Normalizes push payload href before send / SW click.
 * Reuses recoverNotificationHref (Cluster 8 routing SSOT). Never prefers bare `/`.
 */

import {
  recoverNotificationHref,
  type RecoverNotificationHrefContext,
} from "@/lib/notifications/routing";
import { TRANSACTION_HUB_INBOX_PATH } from "@/lib/transaction-hub/inbox-routes";

export const PUSH_NOTIFICATION_FALLBACK_HREF = `${TRANSACTION_HUB_INBOX_PATH}?tab=notifications` as const;

export function resolvePushNotificationHref(
  href: string | undefined | null,
  context?: RecoverNotificationHrefContext,
): string {
  const raw = (href ?? "").trim();
  if (!raw || raw === "/" || raw === "/notifications") {
    return PUSH_NOTIFICATION_FALLBACK_HREF;
  }

  const recovered = recoverNotificationHref(raw, context);
  const pathOnly = recovered.split("?")[0]?.split("#")[0] ?? "";
  const normalized = pathOnly.replace(/\/+$/, "") || "/";

  if (normalized === "/" || normalized === "" || normalized === "/notifications") {
    return PUSH_NOTIFICATION_FALLBACK_HREF;
  }

  return recovered;
}
