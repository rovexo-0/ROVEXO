const MY_LISTINGS_PREFIXES = ["/seller/listings", "/account/listings"] as const;

function normalizePath(path: string): string {
  const base = path.split(/[?#]/)[0] ?? path;
  if (!base || base === "/") return "/";
  return base.replace(/\/+$/, "") || "/";
}

export function isMyListingsPath(path: string): boolean {
  const normalized = normalizePath(path);
  return MY_LISTINGS_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function resolveStorePath(path: string): string | null {
  const normalized = normalizePath(path);
  const match = normalized.match(/^\/(store|user)\/([^/]+)$/);
  if (!match) return null;
  return `/${match[1]}/${match[2]}`;
}

/** Fallback when listing detail has no usable browser history. */
export function resolveListingBackFallback(previousPath: string | null): string {
  if (!previousPath) return "/";

  const normalized = normalizePath(previousPath);

  if (isMyListingsPath(normalized)) {
    return "/seller/listings";
  }

  const storePath = resolveStorePath(normalized);
  if (storePath) return storePath;

  if (
    normalized === "/" ||
    normalized.startsWith("/search") ||
    normalized.startsWith("/category") ||
    normalized.startsWith("/categories")
  ) {
    return "/";
  }

  if (normalized.startsWith("/") && !normalized.startsWith("/listing/")) {
    return normalized;
  }

  return "/";
}
