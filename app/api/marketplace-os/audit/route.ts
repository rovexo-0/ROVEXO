import { getRecentAuditLog } from "@/lib/marketplace-os/audit";

export async function GET() {
  const auditLog = getRecentAuditLog(100);
  return Response.json({ auditLog });
}
