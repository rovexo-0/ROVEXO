import { NextResponse } from "next/server";
import { getUserRole, isPlatformAdminRole, requireApiAuth } from "@/lib/auth/session";
import { applyOrderAction, getOrderById } from "@/lib/orders/store";
import { canPerformOrderAction } from "@/lib/orders/role";
import type { AddTrackingInput, OrderAction } from "@/lib/orders/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.buyer.id !== auth.user.id && order.seller.id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      action?: OrderAction;
      trackingNumber?: string;
    };

    if (!body.action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (existing.buyer.id !== auth.user.id && existing.seller.id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const role = await getUserRole(auth.user.id);
    if (!canPerformOrderAction(body.action, existing, auth.user.id, isPlatformAdminRole(role ?? "buyer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload: AddTrackingInput | undefined = body.trackingNumber
      ? { trackingNumber: body.trackingNumber }
      : undefined;

    const order = await applyOrderAction(id, body.action, payload);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
