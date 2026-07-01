/** Route prefixes where the public marketing footer must not render. */
export const AUTHENTICATED_APP_PREFIXES = [
  "/buyer",
  "/seller",
  "/sell",
  "/business",
  "/account",
  "/admin",
  "/super-admin",
] as const;

export function isAuthenticatedAppRoute(pathname: string): boolean {
  return AUTHENTICATED_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
