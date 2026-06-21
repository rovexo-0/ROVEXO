import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { answerHelpQuestion } from "@/lib/help/assistant";

const querySchema = z.object({
  query: z.string().min(2).max(500),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "help-assistant", 20, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = querySchema.parse(await request.json());
    return NextResponse.json(answerHelpQuestion(body.query));
  } catch {
    return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  }
}
