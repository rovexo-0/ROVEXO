import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeHomepageCertificationAction } from "@/lib/homepage-enterprise-certification-engine/actions";
import { getHomepageCertificationSnapshot } from "@/lib/homepage-enterprise-certification-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const action = parsed.data.action ?? "analyze";
  try {
    const result = await executeHomepageCertificationAction(action, auth.user.id, parsed.data);
    const homepageCertification = await getHomepageCertificationSnapshot();
    return NextResponse.json({ ok: true, ...result, homepageCertification });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
