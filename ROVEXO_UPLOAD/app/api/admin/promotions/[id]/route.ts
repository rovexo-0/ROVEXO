import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/session";
import {
  adminActivatePromotion,
  adminExpirePromotion,
  adminRefundPromotion,
  adminSuspendPromotion,
} from "@/lib/promotions/admin";

type RouteContext = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["activate", "suspend", "expire", "refund"]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  try {
    const body = actionSchema.parse(await request.json());
    const result =
      body.action === "activate"
        ? await adminActivatePromotion(id)
        : body.action === "suspend"
          ? await adminSuspendPromotion(id)
          : body.action === "refund"
            ? await adminRefundPromotion(id)
            : await adminExpirePromotion(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Action failed." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
