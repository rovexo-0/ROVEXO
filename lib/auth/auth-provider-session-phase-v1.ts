/**
 * OPT-P0-PERF-07 — AuthProvider session phase helpers (no new auth system).
 *
 * ready === false OR loading → PENDING (never guest-skip)
 * ready && !profile → GUEST
 * ready && profile → AUTHENTICATED
 */

export type AuthProviderSessionPhase = "pending" | "guest" | "authenticated";

export type AuthProviderSessionSlice = {
  ready: boolean;
  loading: boolean;
  profile: unknown | null;
};

export function resolveAuthProviderSessionPhase(
  auth: AuthProviderSessionSlice | null | undefined,
): AuthProviderSessionPhase {
  if (!auth || !auth.ready || auth.loading) return "pending";
  if (auth.profile == null) return "guest";
  return "authenticated";
}
