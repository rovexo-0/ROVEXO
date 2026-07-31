import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  deletePreferredMarketplaceStore,
  findSellerIdByEmail,
  listPreferredMarketplaceStores,
  upsertPreferredMarketplaceStore,
} from "@/lib/preferred-marketplace-stores/store";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  sellerEmail: z.string().email().optional(),
  enabled: z.boolean().optional(),
  homepageVisibility: z.boolean().optional(),
  promotionPriority: z.number().int().optional(),
  minPosition: z.number().int().min(1).optional(),
  maxPosition: z.number().int().min(1).optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  maxSimultaneousListings: z.number().int().min(1).max(5).optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const stores = await listPreferredMarketplaceStores();
  return NextResponse.json({ stores });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = upsertSchema.parse(await request.json());
    let sellerId = body.sellerId ?? null;
    if (!sellerId && body.sellerEmail) {
      sellerId = await findSellerIdByEmail(body.sellerEmail);
    }
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    }

    const store = await upsertPreferredMarketplaceStore({
      actorId: auth.user.id,
      id: body.id,
      store: {
        sellerId,
        enabled: body.enabled,
        homepageVisibility: body.homepageVisibility,
        promotionPriority: body.promotionPriority,
        minPosition: body.minPosition,
        maxPosition: body.maxPosition,
        startAt: body.startAt,
        endAt: body.endAt,
        maxSimultaneousListings: body.maxSimultaneousListings,
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Unable to save preferred store." }, { status: 500 });
    }

    return NextResponse.json({ store });
  } catch {
    return NextResponse.json({ error: "Invalid preferred store payload." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = z.object({ id: z.string().uuid() }).parse(await request.json());
    const ok = await deletePreferredMarketplaceStore({
      actorId: auth.user.id,
      id: body.id,
    });
    if (!ok) {
      return NextResponse.json({ error: "Unable to remove preferred store." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid delete payload." }, { status: 400 });
  }
}
