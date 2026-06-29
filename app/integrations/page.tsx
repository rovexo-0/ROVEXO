import { Suspense } from "react";
import { IntegrationsEngineHub } from "@/features/integrations-engine/IntegrationsEngineHub";
import { INTEGRATIONS_ENGINE_MODULES } from "@/lib/integrations-engine/registry";
import {
  getIntegrationsEngineAnalyticsForUser,
  getIntegrationsEngineContext,
  getPublicIntegrationsEngineConfig,
} from "@/lib/integrations-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function IntegrationsRoute() {
  const profile = await getProfile();
  const [config, context, analytics] = await Promise.all([
    getPublicIntegrationsEngineConfig(),
    getIntegrationsEngineContext(profile.id),
    getIntegrationsEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="integ-hub p-ds-5">Loading integrations…</div>}>
      <IntegrationsEngineHub
        config={config}
        context={context}
        modules={INTEGRATIONS_ENGINE_MODULES}
        analytics={analytics}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Integrations | ROVEXO",
    description: "ROVEXO Integrations Engine — providers, webhooks, API management, and health monitoring.",
    robots: { index: false, follow: false },
  };
}
