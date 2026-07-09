import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  getShippingProvidersSnapshot,
  setShippoFallbackForced,
} from "@/lib/shipping/providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  shippoFallbackForced: z.boolean(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getShippingProvidersSnapshot();
  return NextResponse.json({ ok: true, ...snapshot });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid provider config." }, { status: 400 });
  }

  await setShippoFallbackForced(body.shippoFallbackForced, auth.user.id);
  const snapshot = await getShippingProvidersSnapshot();

  return NextResponse.json({ ok: true, ...snapshot });
}
