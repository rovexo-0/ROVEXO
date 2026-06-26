import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isMarketplaceConnectorsEnabled } from "@/lib/seller/marketplace/config";
import { getMarketplaceAnalyticsSnapshot } from "@/lib/seller/marketplace/adapters/analytics";
import { getMarketplaceManagerSummary } from "@/lib/seller/marketplace/manager";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isMarketplaceConnectorsEnabled()) {
    return NextResponse.json({ summary: null, analytics: null });
  }

  const [summary, analytics] = await Promise.all([
    getMarketplaceManagerSummary(auth.user.id),
    getMarketplaceAnalyticsSnapshot(auth.user.id),
  ]);

  return NextResponse.json({ summary, analytics });
}
