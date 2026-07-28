/** Protected route prefixes — guests may browse listings but not these surfaces. */

export const AUTH_PROTECTED_PREFIXES = [
  "/account",
  "/buyer",
  "/cart",
  "/orders",
  "/payments",
  "/protection",
  "/wallet",
  "/balance",
  "/shipping",
  "/messages",
  "/inbox",
  "/saved",
  "/notifications",
  "/analytics",
  "/security",
  "/ai",
  "/integrations",
  "/settings",
  "/checkout",
  "/sell",
  "/seller",
  "/import",
  "/business",
  "/admin",
  "/super-admin",
  "/dashboard",
  "/resolution",
] as const;

/** Platform Admin Console — `admin` + `super_admin` (not Super Admin Command Center). */
export const AUTH_ADMIN_PREFIXES = ["/admin"] as const;

/** Super Admin Command Center + staff console — `super_admin` only. */
export const AUTH_SUPER_ADMIN_PREFIXES = [
  "/super-admin",
  "/dashboard",
  "/staff",
] as const;

export const AUTH_PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
] as const;

export function isAuthProtectedPath(pathname: string): boolean {
  return AUTH_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
