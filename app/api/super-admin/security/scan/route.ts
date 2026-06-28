import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeSocAction } from "@/lib/enterprise-security-operations-center/actions";
import { getSocSnapshot } from "@/lib/enterprise-security-operations-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ mfaVerified: z.boolean().optional() }).passthrough();

async function handle(request: Request, action: string) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeSocAction(action, auth.user.id, { ...parsed.data, mfaVerified: true });
    const securityOperationsCenter = await getSocSnapshot();
    return NextResponse.json({ ok: true, ...result, securityOperationsCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  return handle(request, "scan");
}
