import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HomeSkeleton } from "@/components/skeletons/PageSkeletons";

/**
 * Platform-group loading — homepage / marketplace skeleton.
 * Lives here (not root) so root `app/loading.tsx` never needs `headers()` (P9 cache).
 */
export default function PlatformGroupLoading() {
  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home">
      <HomeSkeleton />
    </BetaAppShell>
  );
}
