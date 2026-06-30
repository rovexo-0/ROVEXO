import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { createSupportTicket } from "@/lib/support/service";
import type { SupportHelpContext } from "@/lib/help/types";

const supportCategorySchema = z.enum([
  "account",
  "buying",
  "selling",
  "payments",
  "delivery",
  "chat",
  "technical",
  "business",
  "pro_seller",
  "appeal_moderation",
  "report_user",
  "other",
]);

const supportSchema = z.object({
  category: supportCategorySchema,
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  attachmentUrls: z.array(z.string().min(1)).max(5).optional(),
  helpContext: z
    .object({
      helpTopicSlug: z.string().optional(),
      decisionTreePath: z.array(z.any()).optional(),
      articlesViewed: z.array(z.string()).optional(),
      solutionsViewed: z.array(z.string()).optional(),
      treeCompleted: z.boolean().optional(),
      resolutionAttempted: z.boolean().optional(),
      currentPage: z.string().optional(),
      device: z.string().optional(),
      browser: z.string().optional(),
      platformVersion: z.string().optional(),
      country: z.string().optional(),
      accountType: z.string().optional(),
      errorCode: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "support-create", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const userLimited = await enforceRateLimitForUser(auth.user.id, "support-create-user", 5, 60_000);
  if (userLimited) return userLimited;

  try {
    const body = supportSchema.parse(await request.json());
    const ticket = await createSupportTicket({
      userId: auth.user.id,
      category: body.category,
      subject: body.subject,
      description: body.description,
      attachmentUrls: body.attachmentUrls,
      helpContext: body.helpContext as SupportHelpContext | undefined,
    });

    if (!ticket) {
      return NextResponse.json({ error: "Unable to create support ticket." }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticketNumber: ticket.ticketNumber });
  } catch {
    return NextResponse.json({ error: "Invalid support request." }, { status: 400 });
  }
}
