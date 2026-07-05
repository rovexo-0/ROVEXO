import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HomeSkeleton } from "@/components/skeletons/PageSkeletons";

export default function HomeLoading() {
  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home">
      <HomeSkeleton />
    </BetaAppShell>
  );
}
