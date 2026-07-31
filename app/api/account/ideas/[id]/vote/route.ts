import { NextResponse } from "next/server";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { setIdeaVote } from "@/lib/rovexo-ideas/repository";
import { voteRovexoIdeaSchema } from "@/lib/rovexo-ideas/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimitForUser(auth.user.id, "rovexo-ideas-vote", 60, 60_000);
  if (limited) return limited;

  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = voteRovexoIdeaSchema.safeParse({
    ideaId: id,
    vote: json?.vote,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  try {
    const result = await setIdeaVote({
      userId: auth.user.id,
      ideaId: parsed.data.ideaId,
      vote: parsed.data.vote,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to vote." },
      { status: 400 },
    );
  }
}
