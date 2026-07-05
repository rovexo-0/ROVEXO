import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { isTransactionMode, TRANSACTION_MODES } from "@/lib/transaction-mode/types";
import { updateCategoryTransactionModeCascade } from "@/lib/transaction-mode/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  transactionMode: z.enum(TRANSACTION_MODES),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  if (!isTransactionMode(parsed.data.transactionMode)) {
    return NextResponse.json({ error: "Invalid transaction mode." }, { status: 400 });
  }

  try {
    const result = await updateCategoryTransactionModeCascade(id, parsed.data.transactionMode);
    return NextResponse.json({ ok: true, ...result, transactionMode: parsed.data.transactionMode });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update transaction mode." },
      { status: 400 },
    );
  }
}
