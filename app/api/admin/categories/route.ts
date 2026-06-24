import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import {
  createAdminCategory,
  listAdminCategories,
  seedAllTopLevelCategoryFilters,
} from "@/lib/categories/admin";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const categories = await listAdminCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    action?: string;
    name?: string;
    slug?: string;
    parentId?: string | null;
    pathLabel?: string;
    sortOrder?: number;
    icon?: string;
    seoTitle?: string;
    seoDescription?: string;
  };

  if (body.action === "seed_filters") {
    const count = await seedAllTopLevelCategoryFilters();
    return NextResponse.json({ seeded: count });
  }

  if (!body.name || !body.slug || !body.pathLabel) {
    return NextResponse.json({ error: "name, slug, and pathLabel are required." }, { status: 400 });
  }

  const category = await createAdminCategory({
    name: body.name,
    slug: body.slug,
    parentId: body.parentId,
    pathLabel: body.pathLabel,
    sortOrder: body.sortOrder,
    icon: body.icon,
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
  });

  if (!category) {
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }

  return NextResponse.json({ category }, { status: 201 });
}
