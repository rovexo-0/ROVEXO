import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  adjustWalletBalance,
  grantPromotion,
  grantPromotionCredits,
} from "@/lib/super-admin/grants";
import type { PromotionType } from "@/lib/promotions/config";

const grantSchema = z.object({
  type: z.enum(["feature", "bump", "wallet", "credits", "premium"]),
  userId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  amount: z.number().optional(),
  credits: z.number().int().positive().optional(),
  description: z.string().optional(),
  durationId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = grantSchema.parse(await request.json());

    switch (body.type) {
      case "feature":
      case "bump":
        if (!body.productId) {
          return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
        }
        await grantPromotion({
          actorId: auth.user.id,
          sellerId: body.userId,
          productId: body.productId,
          type: body.type as PromotionType,
          durationId: body.durationId,
        });
        break;
      case "wallet":
        await adjustWalletBalance({
          actorId: auth.user.id,
          userId: body.userId,
          amount: body.amount ?? 0,
          description: body.description ?? "Super Admin wallet grant",
        });
        break;
      case "credits":
        await grantPromotionCredits({
          actorId: auth.user.id,
          userId: body.userId,
          credits: body.credits ?? 1,
        });
        break;
      case "premium":
        {
          const { updateSuperAdminUser } = await import("@/lib/super-admin/users");
          await updateSuperAdminUser({
            actorId: auth.user.id,
            userId: body.userId,
            action: "set_entitlements",
            payload: { premium: true },
          });
        }
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to grant benefit.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
