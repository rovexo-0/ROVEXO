import { readLiveMarketplaceIntelligenceDocument } from "@/lib/marketplace-intelligence/engine";
import { buildMarketplaceZeroResultRecovery } from "@/lib/marketplace-intelligence/zero-result-recovery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const count = Number(searchParams.get("count") ?? "0");

  const document = await readLiveMarketplaceIntelligenceDocument();
  const recovery = buildMarketplaceZeroResultRecovery(
    query,
    Number.isFinite(count) ? count : 0,
    document.thresholds,
  );

  return Response.json({ recovery });
}
