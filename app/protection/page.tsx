import { Suspense } from "react";
import { ProtectionEngineHub } from "@/features/protection-engine/ProtectionEngineHub";
import { PROTECTION_ENGINE_MODULES } from "@/lib/protection-engine/registry";
import {
  getProtectionEngineAnalyticsForUser,
  getProtectionEngineContext,
  getPublicProtectionEngineConfig,
  listProtectionEngineSummaries,
} from "@/lib/protection-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function ProtectionRoute() {
  const profile = await getProfile();
  const [config, context, summaries, analytics] = await Promise.all([
    getPublicProtectionEngineConfig(),
    getProtectionEngineContext(profile.id),
    listProtectionEngineSummaries(profile.id),
    getProtectionEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="bp-hub p-ds-5">Loading protection…</div>}>
      <ProtectionEngineHub
        config={config}
        context={context}
        modules={PROTECTION_ENGINE_MODULES}
        summaries={summaries}
        analytics={analytics}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Purchase Protection | ROVEXO",
    description: "ROVEXO Purchase Protection Engine — dispute centre, evidence, fund protection, and analytics.",
    robots: { index: false, follow: false },
  };
}
