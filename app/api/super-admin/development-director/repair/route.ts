import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeDevDirectorAction } from "@/lib/omega-development-director/actions";
import { getDevDirectorSnapshot } from "@/lib/omega-development-director/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const action = parsed.data.action ?? "repair";
  try {
    const result = await executeDevDirectorAction(action, auth.user.id, parsed.data);
    const developmentDirector = await getDevDirectorSnapshot();
    return NextResponse.json({ ok: true, ...result, developmentDirector });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
