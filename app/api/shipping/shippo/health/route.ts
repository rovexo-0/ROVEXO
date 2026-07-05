import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { ShippoService } from "@/lib/shipping/shippo/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const health = await ShippoService.checkHealth();
  return NextResponse.json({ ok: health.status === "healthy", health });
}
