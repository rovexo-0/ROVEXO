import { requireMarketplaceOsAccess } from "@/lib/marketplace-os/api-guard-v1";
import { buildMosControlCenterSnapshot } from "@/lib/marketplace-os/dashboard";

export async function GET(request: Request) {
  const gate = await requireMarketplaceOsAccess(request, "/api/marketplace-os/alerts");
  if (!gate.ok) return gate.response;

  const snapshot = await buildMosControlCenterSnapshot();
  return Response.json({ alerts: snapshot.alerts });
}
