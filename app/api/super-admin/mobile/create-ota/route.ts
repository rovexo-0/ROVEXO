import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeMobileCcAction } from "@/lib/enterprise-mobile-control-center/actions";
import { getMobileCcSnapshot } from "@/lib/enterprise-mobile-control-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  otaType: z.string().optional(),
  version: z.string().optional(),
  mfaVerified: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));

  try {
    const result = await executeMobileCcAction("create-ota", auth.user.id, { ...parsed.data, mfaVerified: true });
    const mobileControlCenter = await getMobileCcSnapshot("ota");
    return NextResponse.json({ ok: true, ...result, mobileControlCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OTA failed" }, { status: 400 });
  }
}
