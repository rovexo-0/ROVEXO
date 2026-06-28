import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeHomepageBuilderConfigAction } from "@/lib/homepage-builder-engine/config-actions";
import { getHomepageBuilderSnapshot } from "@/lib/homepage-builder-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    await executeHomepageBuilderConfigAction(parsed.data.action, auth.user.id, parsed.data as { document?: import("@/lib/homepage-builder-engine/config").HomepageBuilderConfigDocument; historyId?: string });
    const snapshot = await getHomepageBuilderSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ ok: true, message: "Section delete requires action payload via POST" });
}
