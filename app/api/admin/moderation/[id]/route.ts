import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/session";
import { overrideModerationDecision, resolveModerationQueueItem } from "@/lib/moderation/service";

type RouteContext = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["approve", "warn", "block", "override"]),
  notes: z.string().max(1000).optional(),
  overrideDecision: z.enum(["approved", "warning", "blocked"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = actionSchema.parse(await request.json());

    if (body.action === "override") {
      if (!body.overrideDecision) {
        return NextResponse.json({ error: "Override decision required." }, { status: 400 });
      }
      const item = await overrideModerationDecision({
        queueId: id,
        reviewerId: auth.user.id,
        decision: body.overrideDecision,
        notes: body.notes ?? "",
      });
      return NextResponse.json({ item });
    }

    const decision =
      body.action === "approve" ? "approved" : body.action === "warn" ? "warning" : "blocked";

    const item = await resolveModerationQueueItem({
      queueId: id,
      reviewerId: auth.user.id,
      decision,
      notes: body.notes,
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update moderation item." }, { status: 500 });
  }
}
