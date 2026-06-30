import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { importRegistryDocument } from "@/lib/enterprise-module-registry-v2/engine";
import { getModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/reader";
import type { RegistryV2Document } from "@/lib/enterprise-module-registry-v2/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  document: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    await importRegistryDocument(parsed.data.document as unknown as RegistryV2Document, auth.user.id);
    const snapshot = await getModuleRegistryV2Snapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 400 });
  }
}
