import { buildMosControlCenterSnapshot } from "@/lib/marketplace-os/dashboard";
import { getMosSnapshotForAdmin } from "@/lib/marketplace-os/engine";
import { runMosAutomation } from "@/lib/marketplace-os/automation";
import { readLiveMosDocument } from "@/lib/marketplace-os/engine";

export async function getMosSnapshot() {
  const [snapshot, config] = await Promise.all([
    buildMosControlCenterSnapshot(),
    getMosSnapshotForAdmin(),
  ]);
  return { snapshot, ...config };
}

export async function getMarketplaceStatus() {
  const snapshot = await buildMosControlCenterSnapshot();
  return {
    status: snapshot.marketplaceState.status,
    healthScore: snapshot.marketplaceState.healthScore,
    evaluatedAt: snapshot.marketplaceState.evaluatedAt,
  };
}

export async function executeMosAutomation() {
  const document = await readLiveMosDocument();
  const { queue, result } = await runMosAutomation(document);
  const snapshot = await buildMosControlCenterSnapshot(result);
  return { snapshot, queue, result };
}

export type { MosControlCenterSnapshot } from "@/lib/marketplace-os/types";
