import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { setMobileDistributionLanguage } from "@/lib/mobile-distribution-center-engine/engine";
import { getMobileDistributionCenterEngineSnapshot } from "@/lib/mobile-distribution-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  language: z.enum(["en", "ro"]),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await setMobileDistributionLanguage(parsed.data.language, auth.user.id);
  const snapshot = await getMobileDistributionCenterEngineSnapshot();
  return NextResponse.json({ ok: true, snapshot });
}
