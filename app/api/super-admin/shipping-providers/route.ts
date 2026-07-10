import { NextResponse } from "next/server";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getShippingProvidersSnapshot } from "@/lib/shipping/providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getShippingProvidersSnapshot();
  return NextResponse.json({ ok: true, ...snapshot });
}
