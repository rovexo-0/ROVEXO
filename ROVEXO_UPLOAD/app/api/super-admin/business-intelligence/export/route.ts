import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeBiAction } from "@/lib/enterprise-business-intelligence/actions";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ format: z.enum(["pdf", "csv", "excel", "json"]).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeBiAction("export", auth.user.id, { format: parsed.data.format ?? "json", mfaVerified: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const format = new URL(request.url).searchParams.get("format") ?? "json";

  try {
    const result = await executeBiAction("export", auth.user.id, { format, mfaVerified: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400 });
  }
}
