import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getMarketplaceCompletionSnapshot } from "@/lib/enterprise-marketplace-completion-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const marketplaceCompletion = await getMarketplaceCompletionSnapshot("dashboard");
  return NextResponse.json({ marketplaceCompletion });
}
