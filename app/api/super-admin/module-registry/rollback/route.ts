import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { rollbackRegistry } from "@/lib/enterprise-module-registry-v2/engine";
import { getModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  historyId: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    await rollbackRegistry(parsed.data.historyId, auth.user.id);
    const snapshot = await getModuleRegistryV2Snapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Rollback failed" }, { status: 400 });
  }
}
