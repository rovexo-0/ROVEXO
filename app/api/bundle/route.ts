import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCookieOrBearerApiAuth } from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import {
  addLineToActiveBundle,
  discardActiveBundle,
  getActiveBundleForBuyer,
  removeActiveBundleItem,
  updateActiveBundleItemQuantity,
} from "@/lib/bundle/bundle-server-engine-v1";
import { revalidateBundleForCheckout } from "@/lib/bundle/bundle-checkout-integrity-v1";

const addSchema = z.object({
  action: z.literal("add"),
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
  sellerName: z.string().max(120).optional(),
  quantity: z.number().int().positive().max(999),
  slug: z.string().min(1).max(200).optional(),
  title: z.string().max(300).optional(),
  imageUrl: z.string().max(2000).optional(),
  unitPrice: z.number().nonnegative().optional(),
  maxStock: z.number().int().positive().optional(),
});

const qtySchema = z.object({
  action: z.literal("set_qty"),
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
});

const removeSchema = z.object({
  action: z.literal("remove"),
  productId: z.string().uuid(),
});

const discardSchema = z.object({
  action: z.literal("discard"),
});

const revalidateSchema = z.object({
  action: z.literal("revalidate"),
});

const bodySchema = z.discriminatedUnion("action", [
  addSchema,
  qtySchema,
  removeSchema,
  discardSchema,
  revalidateSchema,
]);

export async function GET(request: Request) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const bundle = await getActiveBundleForBuyer(auth.user.id);
  return NextResponse.json({ ok: true, bundle });
}

export async function POST(request: Request) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = auth.user;
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }

    const body = parsed.data;

    if (body.action === "add") {
      const result = await addLineToActiveBundle({
        buyerId: user.id,
        sellerId: body.sellerId,
        sellerName: body.sellerName?.trim() || "Seller",
        line: {
          productId: body.productId,
          slug: body.slug ?? "",
          title: body.title ?? "",
          imageUrl: body.imageUrl ?? "",
          unitPrice: body.unitPrice ?? 0,
          quantity: body.quantity,
          maxStock: body.maxStock ?? body.quantity,
        },
      });

      if (!result.ok) {
        const status = result.reason === "other_seller" ? 409 : 400;
        return NextResponse.json(
          {
            ok: false,
            reason: result.reason,
            existingSellerName: result.existingSellerName,
            existingBundleId: result.existingBundleId,
            error: result.message,
          },
          { status },
        );
      }
      return NextResponse.json({ ok: true, bundle: result.bundle });
    }

    if (body.action === "set_qty") {
      const result = await updateActiveBundleItemQuantity({
        buyerId: user.id,
        productId: body.productId,
        quantity: body.quantity,
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.message, reason: result.reason }, { status: 400 });
      }
      return NextResponse.json({ ok: true, bundle: result.bundle });
    }

    if (body.action === "remove") {
      const result = await removeActiveBundleItem({
        buyerId: user.id,
        productId: body.productId,
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, bundle: result.bundle });
    }

    if (body.action === "revalidate") {
      const integrity = await revalidateBundleForCheckout({ buyerId: user.id });
      if (!integrity.ok) {
        return NextResponse.json(
          {
            ok: false,
            reason: integrity.reason,
            error: integrity.message,
            unavailable: integrity.unavailable === true,
          },
          { status: 409 },
        );
      }
      const bundle = await getActiveBundleForBuyer(user.id);
      return NextResponse.json({
        ok: true,
        bundle,
        snapshot: integrity.snapshot,
      });
    }

    if (body.action === "discard") {
      await discardActiveBundle(user.id);
      return NextResponse.json({ ok: true, bundle: null });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to update bundle." }, { status: 500 });
  }
}
