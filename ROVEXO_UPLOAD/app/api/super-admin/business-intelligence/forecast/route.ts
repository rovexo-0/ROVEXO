import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeBiAction } from "@/lib/enterprise-business-intelligence/actions";
import { getBiSnapshot } from "@/lib/enterprise-business-intelligence/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ forecastType: z.string().optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeBiAction("forecast", auth.user.id, { ...parsed.data, mfaVerified: true });
    const businessIntelligence = await getBiSnapshot("forecasting");
    return NextResponse.json({ ok: true, ...result, businessIntelligence });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Forecast failed" }, { status: 400 });
  }
}
