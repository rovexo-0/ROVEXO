import { NextResponse } from "next/server";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { setIdeaFollow } from "@/lib/rovexo-ideas/repository";
import { followRovexoIdeaSchema } from "@/lib/rovexo-ideas/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimitForUser(auth.user.id, "rovexo-ideas-follow", 40, 60_000);
  if (limited) return limited;

  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = followRovexoIdeaSchema.safeParse({
    ideaId: id,
    follow: Boolean(json?.follow),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid follow." }, { status: 400 });
  }

  try {
    const result = await setIdeaFollow({
      userId: auth.user.id,
      ideaId: parsed.data.ideaId,
      follow: parsed.data.follow,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to follow." },
      { status: 400 },
    );
  }
}
