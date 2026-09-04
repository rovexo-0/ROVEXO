/**
 * Orders returnTo compatibility — preserve Business Menu destination.
 * Allowlisted internal paths only. Never open-redirect.
 */

export const ORDERS_RETURN_TO_ALLOWLIST = [
  "/business/menu",
  "/business/dashboard",
  "/account",
] as const;

export type OrdersReturnTo = (typeof ORDERS_RETURN_TO_ALLOWLIST)[number];

export function resolveOrdersReturnTo(value: string | null | undefined): OrdersReturnTo | null {
  if (!value) return null;
  return (ORDERS_RETURN_TO_ALLOWLIST as readonly string[]).includes(value)
    ? (value as OrdersReturnTo)
    : null;
}

export function resolveOrdersBackHref(returnTo: string | null | undefined): {
  href: string;
  label: string;
} {
  const safe = resolveOrdersReturnTo(returnTo);
  if (safe === "/business/menu" || safe === "/business/dashboard") {
    return { href: safe, label: "Business" };
  }
  return { href: "/account", label: "My Account" };
}

export function withOrdersReturnTo(
  tab: string,
  status: string | null | undefined,
  returnTo: string | null | undefined,
): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (status && status !== "all") params.set("status", status);
  const safe = resolveOrdersReturnTo(returnTo);
  if (safe) params.set("returnTo", safe);
  return `/orders?${params.toString()}`;
}
