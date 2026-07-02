import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeMobileCcAction } from "@/lib/enterprise-mobile-control-center/actions";
import { getMobileCcSnapshot } from "@/lib/enterprise-mobile-control-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  deviceId: z.string().min(1),
  mfaVerified: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeMobileCcAction("remote-logout", auth.user.id, { ...parsed.data, mfaVerified: true });
    const mobileControlCenter = await getMobileCcSnapshot("devices");
    return NextResponse.json({ ok: true, ...result, mobileControlCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Remote logout failed" }, { status: 400 });
  }
}
