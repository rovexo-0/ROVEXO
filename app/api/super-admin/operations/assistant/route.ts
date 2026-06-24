import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runAiOperationsAssistant } from "@/lib/super-admin/operations/assistant";
import { getAiOperationsSnapshot } from "@/lib/super-admin/operations/snapshot";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = bodySchema.parse(await request.json());
  const snapshot = await getAiOperationsSnapshot();
  const reply = await runAiOperationsAssistant({ message: body.message, snapshot });

  return NextResponse.json({ reply });
}
