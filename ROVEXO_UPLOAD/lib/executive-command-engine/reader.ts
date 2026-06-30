import { fetchExecutiveLiveContext } from "@/lib/executive-command-engine/live";
import { getExecutiveExports } from "@/lib/executive-command-engine/engine";
import { buildExecutiveCommandSnapshot } from "@/lib/executive-command-engine/timeline";
import { getOmegaMetricsPayload } from "@/lib/omega-enterprise-mobile-engine/engine";

export async function getExecutiveCommandSnapshot() {
  const [ctx, metrics, exports] = await Promise.all([
    fetchExecutiveLiveContext(),
    getOmegaMetricsPayload().catch(() => null),
    getExecutiveExports().catch(() => []),
  ]);
  const snapshot = buildExecutiveCommandSnapshot(ctx, metrics?.certifications ?? null, metrics?.security ?? null);
  return { ...snapshot, exports };
}

export async function getExecutiveCommandPageData() {
  const snapshot = await getExecutiveCommandSnapshot();
  return { snapshot };
}
