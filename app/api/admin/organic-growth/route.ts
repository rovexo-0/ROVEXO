import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { buildOrganicGrowthDashboard } from "@/lib/organic-growth/dashboard";
import { runOrganicGrowthAutomation } from "@/lib/organic-growth/automation";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const dashboard = await buildOrganicGrowthDashboard();
  return NextResponse.json({ dashboard });
}

export async function POST() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  await runOrganicGrowthAutomation();
  const dashboard = await buildOrganicGrowthDashboard();
  return NextResponse.json({ dashboard, automation: "completed" });
}
