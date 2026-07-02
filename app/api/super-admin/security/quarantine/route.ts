import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeSocAction } from "@/lib/enterprise-security-operations-center/actions";
import { getSocSnapshot } from "@/lib/enterprise-security-operations-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ targetId: z.string().optional(), eventId: z.string().optional(), mfaVerified: z.boolean().optional() });

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeSocAction("quarantine", auth.user.id, { ...parsed.data, mfaVerified: true });
    const securityOperationsCenter = await getSocSnapshot("live");
    return NextResponse.json({ ok: true, ...result, securityOperationsCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quarantine failed" }, { status: 400 });
  }
}
