import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  listRovexoIdeasForAdmin,
  updateRovexoIdeaStatus,
} from "@/lib/rovexo-ideas/repository";
import { updateRovexoIdeaStatusSchema } from "@/lib/rovexo-ideas/schemas";
import type { RovexoIdeaStatus } from "@/lib/rovexo-ideas/types";
import { ROVEXO_IDEA_STATUSES } from "@/lib/rovexo-ideas/types";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") ?? "all";
  const status = ROVEXO_IDEA_STATUSES.includes(statusParam as RovexoIdeaStatus)
    ? (statusParam as RovexoIdeaStatus)
    : "all";

  const ideas = await listRovexoIdeasForAdmin({
    query: searchParams.get("q") ?? undefined,
    status,
    limit: Number(searchParams.get("limit") ?? 200),
  });

  return NextResponse.json({ ideas });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = updateRovexoIdeaStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  try {
    const idea = await updateRovexoIdeaStatus(parsed.data);
    return NextResponse.json({ idea });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update suggestion." },
      { status: 400 },
    );
  }
}
