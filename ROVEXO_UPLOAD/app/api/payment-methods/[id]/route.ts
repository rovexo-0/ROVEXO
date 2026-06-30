import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { deletePaymentMethod, setDefaultPaymentMethod } from "@/lib/payments/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };

  try {
    if (body.action === "set_default") {
      await setDefaultPaymentMethod(auth.user.id, id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to update payment method." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    await deletePaymentMethod(auth.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to remove payment method." }, { status: 500 });
  }
}
