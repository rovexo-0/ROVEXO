import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import {
  createWholesalePricingTier,
  deleteWholesalePricingTier,
  listWholesalePricingTiers,
} from "@/lib/wholesale/service";

const schema = z.object({
  minQuantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  productId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const tiers = await listWholesalePricingTiers(auth.user.id);
  return NextResponse.json({ tiers });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = schema.parse(await request.json());
    const tier = await createWholesalePricingTier({
      sellerId: auth.user.id,
      minQuantity: body.minQuantity,
      unitPrice: body.unitPrice,
      productId: body.productId,
    });
    if (!tier) return NextResponse.json({ error: "Unable to create pricing tier." }, { status: 500 });
    return NextResponse.json({ success: true, tier });
  } catch {
    return NextResponse.json({ error: "Invalid pricing tier." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing tier id." }, { status: 400 });

  const success = await deleteWholesalePricingTier(auth.user.id, id);
  if (!success) return NextResponse.json({ error: "Unable to delete tier." }, { status: 500 });
  return NextResponse.json({ success: true });
}
