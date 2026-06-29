import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toListingRow(product: {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  created_at: string;
}) {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    status: product.status,
    price: Number(product.price),
    createdAt: product.created_at,
  };
}

const createSchema = z.object({
  title: z.string().min(3).max(120),
  price: z.number().min(0),
  description: z.string().max(5000).optional(),
});

const patchSchema = z.object({
  productId: z.string().uuid(),
  action: z.enum(["publish", "unpublish", "archive", "feature"]),
});

type ProductStatus = "draft" | "published" | "paused" | "sold" | "deleted";

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = createSchema.parse(await request.json());
    const admin = createAdminClient();
    const slugBase = slugify(body.title) || "admin-listing";
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const { data: product, error } = await admin
      .from("products")
      .insert({
        seller_id: auth.user.id,
        slug,
        title: body.title.trim(),
        description: body.description?.trim() || "Admin quick listing",
        price: body.price,
        condition: "good",
        status: "published",
        stock: 1,
        sections: ["new", "trending", "recommended"],
        listing_type: "fixed",
        accept_offers: false,
        delivery_carriers: ["Royal Mail", "Evri"],
      })
      .select("id, title, slug, status, price, created_at")
      .single();

    if (error || !product) {
      return NextResponse.json({ ok: false, error: error?.message ?? "Unable to create listing." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, listing: toListingRow(product) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid listing payload.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = patchSchema.parse(await request.json());
    const admin = createAdminClient();

    const patch =
      body.action === "publish"
        ? { status: "published" as ProductStatus, sections: ["new", "trending", "recommended"] }
        : body.action === "unpublish"
          ? { status: "draft" as ProductStatus, sections: [] as string[] }
          : body.action === "archive"
            ? { status: "paused" as ProductStatus, sections: [] as string[] }
            : { sections: ["featured", "trending", "recommended"] };

    const { data: product, error } = await admin
      .from("products")
      .update(patch)
      .eq("id", body.productId)
      .select("id, title, slug, status, price, created_at")
      .single();

    if (error || !product) {
      return NextResponse.json({ ok: false, error: error?.message ?? "Unable to update listing." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, listing: toListingRow(product) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid listing action.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
