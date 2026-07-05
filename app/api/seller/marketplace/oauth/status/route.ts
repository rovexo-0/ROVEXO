import { NextResponse } from "next/server";
import { requireApiAuth, requireApiMarketplaceOAuth } from "@/lib/auth/session";
import { isMarketplaceConnectorsEnabled } from "@/lib/seller/marketplace/config";
import { getOAuthConnectionsStatus } from "@/lib/seller/marketplace/oauth/connection-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiMarketplaceOAuth();
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isMarketplaceConnectorsEnabled()) {
    return NextResponse.json({ error: "Marketplace connectors are disabled." }, { status: 404 });
  }

  const status = await getOAuthConnectionsStatus(auth.user.id);
  return NextResponse.json(status);
}
