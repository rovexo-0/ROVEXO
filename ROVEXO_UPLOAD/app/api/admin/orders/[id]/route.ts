import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { adminUpdateOrderStatus } from "@/lib/admin/queries";
import type { OrderStatus } from "@/lib/orders/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { status?: OrderStatus };
    if (!body.status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    const ok = await adminUpdateOrderStatus(id, body.status);
    if (!ok) {
      return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
