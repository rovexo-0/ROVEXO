import { NextResponse } from "next/server";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import {
  addIdeaComment,
  deleteIdeaComment,
  editIdeaComment,
} from "@/lib/rovexo-ideas/repository";
import { commentRovexoIdeaSchema, editCommentSchema } from "@/lib/rovexo-ideas/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimitForUser(auth.user.id, "rovexo-ideas-comment", 20, 60_000);
  if (limited) return limited;

  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = commentRovexoIdeaSchema.safeParse({
    ideaId: id,
    body: json?.body,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid comment." },
      { status: 400 },
    );
  }

  try {
    const comment = await addIdeaComment({
      userId: auth.user.id,
      ideaId: parsed.data.ideaId,
      body: parsed.data.body,
    });
    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to comment." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = editCommentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid edit." }, { status: 400 });
  }

  try {
    await editIdeaComment({
      userId: auth.user.id,
      commentId: parsed.data.commentId,
      body: parsed.data.body,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to edit." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  await ctx.params;
  const url = new URL(request.url);
  const commentId = url.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "Missing comment." }, { status: 400 });
  }

  try {
    await deleteIdeaComment({ userId: auth.user.id, commentId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete." },
      { status: 400 },
    );
  }
}
