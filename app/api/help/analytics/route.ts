import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getAuthContext } from "@/lib/auth/session";
import { recordHelpAnalyticsEvent } from "@/lib/help/analytics";
import type { HelpAnalyticsEvent } from "@/lib/help/types";

const analyticsSchema = z.object({
  type: z.enum([
    "search",
    "search_no_results",
    "topic_open",
    "tree_start",
    "tree_step",
    "tree_complete",
    "solution_view",
    "article_view",
    "resolution_yes",
    "resolution_no",
    "support_gate_pass",
    "support_gate_block",
    "support_submit",
  ]),
  topicSlug: z.string().optional(),
  query: z.string().optional(),
  articleSlug: z.string().optional(),
  solutionId: z.string().optional(),
  path: z
    .array(
      z.object({
        nodeId: z.string(),
        optionId: z.string(),
        label: z.string(),
        timestamp: z.string(),
      }),
    )
    .optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "help-analytics", 120, 60_000);
  if (limited) return limited;

  try {
    const body = analyticsSchema.parse(await request.json());
    const auth = await getAuthContext();
    await recordHelpAnalyticsEvent(body as HelpAnalyticsEvent, auth?.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }
}
