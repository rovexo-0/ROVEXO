import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiListingRole } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { resolveListingCategoryId } from "@/lib/categories/resolve-listing";
import {
  createSellerListing,
  getSellerListingById,
  updateSellerListing,
} from "@/lib/listings/repository";
import { DRAFT_DATABASE_SSOT_V1 } from "@/lib/sell/draft-database-ssot-v1";
import { clampInventory } from "@/lib/sell/inventory";
import { deliveryCarriersForMethod } from "@/lib/sell/delivery";
import { validateManualCategorySlugs } from "@/lib/sell/category-engine-v1";
import type { ShippingMethod } from "@/lib/shipping/carriers";

const draftImageSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1).optional(),
  storagePath: z.string().min(1),
  sortOrder: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
});

const draftCategoryPathSchema = z
  .object({
    categorySlug: z.string().min(1),
    subcategorySlug: z.string().min(1),
    childCategorySlug: z.string().optional(),
    categorySlugs: z.array(z.string().min(1)).optional(),
    pathLabel: z.string().optional(),
    segments: z
      .array(
        z.object({
          slug: z.string().min(1),
          name: z.string().min(1),
        }),
      )
      .optional(),
  })
  .nullable()
  .optional();

const upsertDraftSchema = z.object({
  draftId: z.string().uuid().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  condition: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  acceptOffers: z.boolean().optional(),
  freeDelivery: z.boolean().optional(),
  shippingMethod: z.string().optional(),
  parcelSize: z.enum(["small", "medium", "large", "xl"]).nullable().optional(),
  stock: z.number().int().positive().optional(),
  categoryPath: draftCategoryPathSchema,
  images: z.array(draftImageSchema).optional(),
});

function padDraftTitle(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (trimmed.length >= 3) return trimmed;
  if (trimmed.length > 0) return `${trimmed} draft`.slice(0, 80);
  return "Untitled draft";
}

function padDraftDescription(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (trimmed.length >= 10) return trimmed;
  if (trimmed.length > 0) return `${trimmed}${".".repeat(Math.max(0, 10 - trimmed.length))}`;
  return "Draft listing.";
}

function parseDraftPrice(raw: string | number | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw.trim());
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

/**
 * POST /api/sell/draft — upsert products.status='draft' (Sell Draft SSOT).
 * Fail closed: create requires ≥1 image; never returns success without a draft row.
 */
export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiListingRole(request);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const limited = await enforceRateLimitForUser(auth.user.id, "sell-draft", 40, 60_000);
  if (limited) return limited;

  try {
    const body = upsertDraftSchema.parse(await request.json());
    const title = padDraftTitle(body.title);
    const description = padDraftDescription(body.description);
    const condition = body.condition?.trim() || "Good";
    const price = parseDraftPrice(body.price);
    const shippingMethod = (body.shippingMethod as ShippingMethod | undefined) ?? "delivery_available";
    const acceptOffers = body.acceptOffers ?? true;
    const freeDelivery = body.freeDelivery ?? false;
    const stock = clampInventory(body.stock ?? 1);

    let categoryId: string | null | undefined;
    if (body.categoryPath) {
      const pathSlugs = body.categoryPath.categorySlugs?.length
        ? body.categoryPath.categorySlugs
        : [
            body.categoryPath.categorySlug,
            body.categoryPath.subcategorySlug,
            body.categoryPath.childCategorySlug,
          ].filter((slug): slug is string => Boolean(slug?.trim()));

      if (pathSlugs.length === 3) {
        const taxonomyGate = validateManualCategorySlugs(pathSlugs);
        if (!taxonomyGate.ok) {
          return NextResponse.json(
            { error: taxonomyGate.message, code: taxonomyGate.code },
            { status: 400 },
          );
        }
        categoryId = await resolveListingCategoryId({
          categorySlug: pathSlugs[0]!,
          subcategorySlug: pathSlugs[1]!,
          childCategorySlug: pathSlugs[2],
          categorySlugs: pathSlugs,
        });
      }
    }

    const images = (body.images ?? []).map((image, index) => ({
      url: image.url,
      thumbnailUrl: image.thumbnailUrl ?? image.url,
      storagePath: image.storagePath,
      sortOrder: image.sortOrder ?? index,
      isPrimary: image.isPrimary ?? index === 0,
    }));

    if (body.draftId) {
      const existing = await getSellerListingById(auth.user.id, body.draftId);
      if (!existing) {
        return NextResponse.json({ error: "Draft not found.", code: "DRAFT_NOT_FOUND" }, { status: 404 });
      }
      if (existing.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft listings can be updated via draft SSOT.", code: "NOT_A_DRAFT" },
          { status: 409 },
        );
      }

      const listing = await updateSellerListing(auth.user.id, body.draftId, {
        title,
        description,
        brand: body.brand?.trim() || undefined,
        color: body.color?.trim() || undefined,
        size: body.size?.trim() || undefined,
        condition,
        price,
        acceptOffers,
        freeDelivery,
        shippingMethod,
        shippingPrice: freeDelivery ? 0 : undefined,
        deliveryCarriers: deliveryCarriersForMethod(shippingMethod),
        parcelSize: body.parcelSize ?? undefined,
        categoryId: categoryId === undefined ? undefined : categoryId,
        status: DRAFT_DATABASE_SSOT_V1.status,
        inventory: { stock, lowStockAlert: 5 },
        // Images stay on the draft row from create; publish pipeline syncs final set.
      });

      if (!listing || listing.status !== "draft") {
        return NextResponse.json(
          { error: "Unable to save draft to database.", code: "DRAFT_UPDATE_FAILED" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        ok: true,
        draftId: listing.id,
        status: listing.status,
        slug: listing.slug,
      });
    }

    if (images.length === 0) {
      return NextResponse.json(
        {
          error: "Add at least one photo before saving a database draft.",
          code: "DRAFT_PHOTO_REQUIRED",
        },
        { status: 400 },
      );
    }

    const listing = await createSellerListing({
      sellerId: auth.user.id,
      title,
      description,
      brand: body.brand?.trim() || undefined,
      color: body.color?.trim() || undefined,
      size: body.size?.trim() || undefined,
      condition,
      price,
      acceptOffers,
      freeDelivery,
      shippingMethod,
      shippingPrice: freeDelivery ? 0 : null,
      deliveryCarriers: deliveryCarriersForMethod(shippingMethod),
      parcelSize: body.parcelSize ?? null,
      categoryId: categoryId ?? null,
      status: DRAFT_DATABASE_SSOT_V1.status,
      inventory: { stock, lowStockAlert: 5 },
      images,
    });

    if (listing.status !== "draft") {
      return NextResponse.json(
        { error: "Unable to create database draft.", code: "DRAFT_CREATE_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      draftId: listing.id,
      status: listing.status,
      slug: listing.slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid draft payload.", code: "DRAFT_VALIDATION" }, { status: 400 });
    }
    console.error("[api/sell/draft]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save draft.",
        code: "DRAFT_SAVE_FAILED",
      },
      { status: 500 },
    );
  }
}
