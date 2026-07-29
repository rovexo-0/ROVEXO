/**
 * Public Profile href — one SSOT for marketplace → `/user/[username]`.
 * Does not replace Store (`/store/...`); use for identity taps (avatar/name).
 */
export function resolvePublicProfileHref(
  username?: string | null,
): string | null {
  const trimmed = username?.trim() ?? "";
  if (!trimmed) return null;
  return `/user/${encodeURIComponent(trimmed)}`;
}
