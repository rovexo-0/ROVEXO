import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import {
  deleteAdminCategory,
  deleteCategoryFilter,
  getAdminCategory,
  listCategoryFilters,
  seedCategoryFiltersForSlug,
  updateAdminCategory,
  upsertCategoryFilter,
} from "@/lib/categories/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const [category, filters] = await Promise.all([getAdminCategory(id), listCategoryFilters(id)]);

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({ category, filters });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "seed_filters" && typeof body.slug === "string") {
    const count = await seedCategoryFiltersForSlug(id, body.slug);
    return NextResponse.json({ seeded: count });
  }

  if (body.action === "upsert_filter") {
    const filter = await upsertCategoryFilter({
      categoryId: id,
      filterKey: String(body.filterKey),
      label: String(body.label),
      filterType: body.filterType as "text" | "number" | "select" | "boolean" | "range",
      options: Array.isArray(body.options) ? body.options.map(String) : [],
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      isRequired: Boolean(body.isRequired),
    });

    if (!filter) {
      return NextResponse.json({ error: "Failed to save filter." }, { status: 500 });
    }

    return NextResponse.json({ filter });
  }

  if (body.action === "delete_filter" && typeof body.filterId === "string") {
    const ok = await deleteCategoryFilter(body.filterId);
    return NextResponse.json({ deleted: ok });
  }

  const category = await updateAdminCategory(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    parentId: body.parentId === null || typeof body.parentId === "string" ? body.parentId : undefined,
    pathLabel: typeof body.pathLabel === "string" ? body.pathLabel : undefined,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    icon: typeof body.icon === "string" ? body.icon : undefined,
    seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : body.seoTitle === null ? null : undefined,
    seoDescription:
      typeof body.seoDescription === "string"
        ? body.seoDescription
        : body.seoDescription === null
          ? null
          : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  });

  if (!category) {
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const deleted = await deleteAdminCategory(id);
  return NextResponse.json({ deleted });
}
