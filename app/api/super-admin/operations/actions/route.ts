import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runOperationsAutomatedAction } from "@/lib/operations-center-engine/engine";
import { getOperationsCenterEngineSnapshot } from "@/lib/operations-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  actionId: z.string(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    await runOperationsAutomatedAction(body.actionId, auth.user.id);

    if (body.actionId === "clear-cache") {
      revalidatePath("/", "layout");
    }

    const snapshot = await getOperationsCenterEngineSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run action.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
