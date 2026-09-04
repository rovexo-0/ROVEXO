import { BUSINESS_DASHBOARD_ROUTE } from "@/lib/business/access";
import type { SellerContext } from "@/lib/seller-context/seller-context-v1";
import { isSellerContext } from "@/lib/seller-context/seller-context-v1";

export const INDIVIDUAL_ACCOUNT_ROUTE = "/account" as const;

/** Same-tab event after a confirmed PATCH. Not a second seller-context store. */
export const SELLER_CONTEXT_CHANGED_EVENT = "rovexo:seller-context-changed";

/** First-paint only. Canonical truth remains seller_profiles.active_seller_context. */
const CONFIRMED_HINT_MS = 15_000;

export type SwitchSellerContextResult =
  | { ok: true; activeSellerContext: SellerContext }
  | { ok: false; error: string; nextStep?: string };

type SellerContextRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

let inFlight: Promise<SwitchSellerContextResult> | null = null;
let lastConfirmed: { context: SellerContext; at: number } | null = null;

/**
 * Remember the last PATCH-confirmed context for the next Account paint.
 * This is not a persisted seller_context field and never replaces GET /api/business/status.
 */
export function rememberConfirmedSellerContext(context: SellerContext): void {
  lastConfirmed = { context, at: Date.now() };
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SELLER_CONTEXT_CHANGED_EVENT, {
      detail: { activeSellerContext: context },
    }),
  );
  // Invalidate inbox/badge client caches so Account context switch never keeps stale unread.
  window.dispatchEvent(new CustomEvent("rovexo:inbox-sync"));
}

export function peekConfirmedSellerContext(now = Date.now()): SellerContext | null {
  if (!lastConfirmed) return null;
  if (now - lastConfirmed.at > CONFIRMED_HINT_MS) return null;
  return lastConfirmed.context;
}

export function applyConfirmedSellerContextHint<T extends { activeSellerContext: SellerContext }>(
  status: T | null,
  now = Date.now(),
): T | null {
  const hinted = peekConfirmedSellerContext(now);
  lastConfirmed = null;
  if (!status) return status;
  if (!hinted || hinted === status.activeSellerContext) return status;
  return { ...status, activeSellerContext: hinted };
}

/**
 * Canonical post-success destinations.
 * Individual → Business Home. Business → Individual Account.
 * Never `/business/menu` as the switch landing page.
 */
export function sellerContextSwitchHref(
  context: SellerContext,
): typeof BUSINESS_DASHBOARD_ROUTE | typeof INDIVIDUAL_ACCOUNT_ROUTE {
  return context === "business" ? BUSINESS_DASHBOARD_ROUTE : INDIVIDUAL_ACCOUNT_ROUTE;
}

/**
 * App Router navigation after a successful PATCH.
 * Do not call `refresh()` in the same tick as a cross-route `push` — that
 * re-renders the current Account surface and cancels the pending navigation.
 */
export function navigateAfterSellerContextSwitch(
  router: SellerContextRouter,
  context: SellerContext,
  currentPathname?: string | null,
): void {
  const href = sellerContextSwitchHref(context);
  if (currentPathname === href) {
    router.refresh();
    return;
  }
  router.push(href);
}

/**
 * Client caller for the canonical Business Switch (`PATCH /api/business/context`).
 * One in-flight PATCH at a time — double-click shares the same request.
 */
export async function requestSellerContextSwitch(
  context: SellerContext,
): Promise<SwitchSellerContextResult> {
  if (inFlight) return inFlight;
  inFlight = patchSellerContext(context).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function patchSellerContext(context: SellerContext): Promise<SwitchSellerContextResult> {
  const response = await fetch("/api/business/context", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  const json = (await response.json()) as {
    error?: string;
    nextStep?: string;
    activeSellerContext?: string;
  };
  if (!response.ok || !isSellerContext(json.activeSellerContext)) {
    return {
      ok: false,
      error: json.error ?? "Unable to switch seller context.",
      nextStep: json.nextStep,
    };
  }
  rememberConfirmedSellerContext(json.activeSellerContext);
  return { ok: true, activeSellerContext: json.activeSellerContext };
}

/** Test helper — not for production UI. */
export function resetSellerContextSwitchClientForTests(): void {
  inFlight = null;
  lastConfirmed = null;
}
