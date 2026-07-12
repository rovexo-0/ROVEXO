import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executePromotionAdminAction } from "@/lib/promotions/admin-engine";
import { PROMOTION_SOURCES } from "@/lib/promotions/canonical-engine";

const actionSchema = z.object({
  scope: z.enum(["listing", "seller"]).optional(),
  promotionId: z.string().uuid().optional(),
  action: z.enum([
    "grant",
    "activate",
    "schedule",
    "pause",
    "resume",
    "extend",
    "reduce",
    "expire",
    "revoke",
    "duplicate",
    "clone",
  ]),
  reason: z.string().trim().max(500).optional(),
  scheduledStartAt: z.string().datetime().optional(),
  daysDelta: z.number().int().positive().optional(),
  targetUserId: z.string().uuid().optional(),
  targetProductId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  grantType: z.enum(["bump", "feature", "store_featured", "boost_package"]).optional(),
  packageId: z.string().optional(),
  durationId: z.string().optional(),
  customDays: z.number().int().positive().optional(),
  source: z.enum(PROMOTION_SOURCES).optional(),
});

function clientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());
    const scope = body.scope ?? (body.grantType === "store_featured" || body.grantType === "boost_package" ? "seller" : "listing");

    const result = await executePromotionAdminAction(
      {
        actorId: auth.user.id,
        ipAddress: clientIp(request),
      },
      {
        scope,
        promotionId: body.promotionId,
        action: body.action,
        reason: body.reason,
        scheduledStartAt: body.scheduledStartAt,
        daysDelta: body.daysDelta,
        targetUserId: body.targetUserId,
        targetProductId: body.targetProductId,
        grantType: body.grantType,
        userId: body.userId,
        productId: body.productId,
        packageId: body.packageId,
        durationId: body.durationId,
        customDays: body.customDays,
        source: body.source,
      },
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Action failed." }, { status: 400 });
    }

    return NextResponse.json({ success: true, newPromotionId: result.newPromotionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
