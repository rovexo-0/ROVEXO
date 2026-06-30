import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import {
  queuePublishJob,
  runPublishEngine,
} from "@/lib/seller/migration/publish/engine";
import { PUBLISH_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/publish/config";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import type { PublishAction } from "@/lib/seller/migration/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const publishSchema = z.object({
  action: z.enum([
    "publish_all",
    "publish_selected",
    "save_all_draft",
    "schedule_publish",
    "retry_failed",
    "cancel_pending",
    "delete_drafts",
  ]) as z.ZodType<PublishAction>,
  itemIds: z.array(z.string().uuid()).optional(),
  scheduledAt: z.string().min(1).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const existing = await getMigrationJobForSeller(auth.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Migration job not found." }, { status: 404 });
  }

  try {
    const body = publishSchema.parse(await request.json());
    let job = await queuePublishJob(auth.user.id, id, body.action, {
      itemIds: body.itemIds,
      scheduledAt: body.scheduledAt,
    });

    if (!job) {
      return NextResponse.json({ error: "Unable to queue publish job." }, { status: 400 });
    }

    const shouldProcess =
      body.action === "publish_all" ||
      body.action === "publish_selected" ||
      body.action === "retry_failed";

    if (shouldProcess) {
      const mode = body.action === "save_all_draft" ? "draft" : "published";
      job = (await runPublishEngine(auth.user.id, id, PUBLISH_MAX_BATCHES_PER_RUN, mode)) ?? job;
    }

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid publish request." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to publish migration items." }, { status: 500 });
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const existing = await getMigrationJobForSeller(auth.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Migration job not found." }, { status: 404 });
  }

  const job = await runPublishEngine(auth.user.id, id, PUBLISH_MAX_BATCHES_PER_RUN);
  return NextResponse.json({ job });
}
