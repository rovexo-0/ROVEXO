import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { buildMarketplaceIntelligenceDashboard } from "@/lib/marketplace-intelligence/dashboard";
import { runMarketplaceIntelligenceAutomation } from "@/lib/marketplace-intelligence/automation";
import { readLiveMarketplaceIntelligenceDocument } from "@/lib/marketplace-intelligence/engine";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const dashboard = await buildMarketplaceIntelligenceDashboard();
  return NextResponse.json({ dashboard });
}

export async function POST() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const document = await readLiveMarketplaceIntelligenceDocument();
  const automation = await runMarketplaceIntelligenceAutomation(document.thresholds);
  const dashboard = await buildMarketplaceIntelligenceDashboard();
  return NextResponse.json({ dashboard, automation });
}
