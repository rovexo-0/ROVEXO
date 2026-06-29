import { Suspense } from "react";
import { SecurityEngineHub } from "@/features/security-engine/SecurityEngineHub";
import { SECURITY_ENGINE_MODULES } from "@/lib/security-engine/registry";
import {
  getPublicSecurityEngineConfig,
  getSecurityEngineAnalyticsForUser,
  getSecurityEngineContext,
} from "@/lib/security-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function SecurityRoute() {
  const profile = await getProfile();
  const [config, context, analytics] = await Promise.all([
    getPublicSecurityEngineConfig(),
    getSecurityEngineContext(profile.id),
    getSecurityEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="sec-hub p-ds-5">Loading security…</div>}>
      <SecurityEngineHub
        config={config}
        context={context}
        modules={SECURITY_ENGINE_MODULES}
        analytics={analytics}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Security | ROVEXO",
    description: "ROVEXO Security Engine — authentication, authorization, sessions, devices, and compliance.",
    robots: { index: false, follow: false },
  };
}
