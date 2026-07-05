import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SavedSkeleton } from "@/components/skeletons/PageSkeletons";

export default function SavedLoading() {
  return (
    <BetaAppShell bottomNavTab="saved">
      <SavedSkeleton />
    </BetaAppShell>
  );
}
