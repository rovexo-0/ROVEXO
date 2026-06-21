import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/session";
import {
  adminCreateManualPromotion,
  getAdminPromotionStats,
  listAdminPromotions,
} from "@/lib/promotions/admin";

const createSchema = z.object({
  sellerId: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.enum(["bump", "feature"]),
  durationId: z.string().min(2),
});

export async function GET(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type");
  const query = searchParams.get("q") ?? undefined;
  const includeStats = searchParams.get("stats") === "1";

  const promotions = await listAdminPromotions({
    status,
    type: type === "bump" || type === "feature" ? type : undefined,
    query,
  });

  if (includeStats) {
    const stats = await getAdminPromotionStats();
    return NextResponse.json({ promotions, stats });
  }

  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = createSchema.parse(await request.json());
    const result = await adminCreateManualPromotion(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Unable to create promotion." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
