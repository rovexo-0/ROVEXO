import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { updateItemCategoryMapping } from "@/lib/seller/migration/publish/engine";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { listMigrationItemsForJob, updateMigrationItemForSeller } from "@/lib/seller/migration/repository-items";
import type { TablesUpdate } from "@/lib/supabase/types/database";
import type { DuplicateAction } from "@/lib/seller/migration/types";

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

const patchSchema = z.object({
  categorySlug: z.string().min(1).optional(),
  sourceCategory: z.string().optional(),
  selected: z.boolean().optional(),
  duplicateAction: z.enum(["skip", "replace", "update", "create_new"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id, itemId } = await context.params;
  const job = await getMigrationJobForSeller(auth.user.id, id);
  if (!job) {
    return NextResponse.json({ error: "Migration job not found." }, { status: 404 });
  }

  const items = await listMigrationItemsForJob(auth.user.id, id);
  const item = items.find((row) => row.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "Migration item not found." }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await request.json());

    if (body.categorySlug) {
      await updateItemCategoryMapping(
        auth.user.id,
        id,
        itemId,
        body.categorySlug,
        job.platform,
        body.sourceCategory ?? body.categorySlug,
      );
    }

    const patch: TablesUpdate<"store_migration_items"> = {};
    if (body.selected !== undefined) patch.selected = body.selected;
    if (body.duplicateAction) {
      patch.duplicate_action = body.duplicateAction as DuplicateAction;
      if (body.duplicateAction === "skip") {
        patch.publish_status = "skipped";
      } else if (item.publishStatus === "skipped") {
        patch.publish_status = "pending";
      }
    }

    if (Object.keys(patch).length) {
      await updateMigrationItemForSeller(auth.user.id, itemId, patch);
    }

    const updated = await listMigrationItemsForJob(auth.user.id, id);
    const nextItem = updated.find((row) => row.id === itemId);
    return NextResponse.json({ item: nextItem ?? null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid item update." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to update migration item." }, { status: 500 });
  }
}
