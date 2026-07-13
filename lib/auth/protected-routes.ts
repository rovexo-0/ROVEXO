/** Protected route prefixes — guests may browse listings but not these surfaces. */

export const AUTH_PROTECTED_PREFIXES = [
  "/account",
  "/buyer",
  "/cart",
  "/orders",
  "/payments",
  "/protection",
  "/wallet",
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

export const AUTH_SUPER_ADMIN_PREFIXES = [
  "/admin",
  "/super-admin",
  "/dashboard",
  "/staff",
] as const;

export const AUTH_PUBLIC_PREFIXES = [
  "/splash",
  "/welcome",
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
