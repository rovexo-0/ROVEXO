import { Suspense } from "react";
import { AnalyticsEngineHub } from "@/features/analytics-engine/AnalyticsEngineHub";
import { ANALYTICS_ENGINE_MODULES } from "@/lib/analytics-engine/registry";
import {
  getAnalyticsEngineAnalyticsForUser,
  getAnalyticsEngineContext,
  getPublicAnalyticsEngineConfig,
} from "@/lib/analytics-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function AnalyticsRoute() {
  const profile = await getProfile();
  const [config, context, analytics] = await Promise.all([
    getPublicAnalyticsEngineConfig(),
    getAnalyticsEngineContext(profile.id),
    getAnalyticsEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="ae-hub p-ds-5">Loading analytics…</div>}>
      <AnalyticsEngineHub
        config={config}
        context={context}
        modules={ANALYTICS_ENGINE_MODULES}
        analytics={analytics}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Analytics | ROVEXO",
    description: "ROVEXO Analytics Engine — marketplace intelligence, revenue, orders, and live dashboards.",
    robots: { index: false, follow: false },
  };
}
