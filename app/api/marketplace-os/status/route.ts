import { requireMarketplaceOsAccess } from "@/lib/marketplace-os/api-guard-v1";
import { getMarketplaceStatus } from "@/lib/marketplace-os/reader";

export async function GET(request: Request) {
  const gate = await requireMarketplaceOsAccess(request, "/api/marketplace-os/status");
  if (!gate.ok) return gate.response;

  const status = await getMarketplaceStatus();
  return Response.json(status);
}
