import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { importWorkflowConfiguration } from "@/lib/enterprise-workflow-engine/actions";
import { getWorkflowEngineSnapshot } from "@/lib/enterprise-workflow-engine/reader";
import type { WorkflowEngineConfigDocument } from "@/lib/enterprise-workflow-engine/config";

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
    await importWorkflowConfiguration(parsed.data.document as unknown as WorkflowEngineConfigDocument, auth.user.id);
    const snapshot = await getWorkflowEngineSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 400 });
  }
}
