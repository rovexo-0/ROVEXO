import { getMarketplaceStatus } from "@/lib/marketplace-os/reader";

export async function GET() {
  const status = await getMarketplaceStatus();
  return Response.json(status);
}
