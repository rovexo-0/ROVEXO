import { requireMarketplaceOsAccess } from "@/lib/marketplace-os/api-guard-v1";
import { getRecentAuditLog } from "@/lib/marketplace-os/audit";

export async function GET(request: Request) {
  const gate = await requireMarketplaceOsAccess(request, "/api/marketplace-os/audit");
  if (!gate.ok) return gate.response;

  const auditLog = getRecentAuditLog(100);
  return Response.json({ auditLog });
}
