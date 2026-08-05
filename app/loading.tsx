/**
 * Root Suspense fallback — MUST NOT call `headers()` / `cookies()`.
 * Calling `headers()` here forces the entire App Router tree to dynamic rendering
 * (`private, no-store`) and blocks Edge cache for public pages (Phase 7 evidence).
 *
 * Auth cold starts: `app/(auth)/loading.tsx` → SplashFirstPaint
 * Platform navigations: `app/(platform)/loading.tsx` → HomeSkeleton
 *
 * Neutral root fallback only — no pathname branching (P9 production delivery).
 */
export default function RootLoading() {
  return (
    <div
      className="min-h-[100dvh] w-full bg-white"
      aria-busy="true"
      aria-live="polite"
      data-root-loading="neutral"
    />
  );
}
