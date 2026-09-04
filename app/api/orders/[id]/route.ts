import { NextResponse } from "next/server";
import { getUserRole, isPlatformAdminRole } from "@/lib/auth/session";
import { requireCookieOrBearerApiAuth } from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import { applyOrderAction, getOrderById } from "@/lib/orders/store";
import { canPerformOrderAction } from "@/lib/orders/role";
import type { OrderAction } from "@/lib/orders/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireCookieOrBearerApiAuth(request);
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
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      action?: OrderAction;
      trackingNumber?: string;
      cancellationReasonId?: string;
      reasonId?: string;
      description?: string;
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

    const payload =
      body.action === "cancel"
        ? { cancellationReasonId: body.cancellationReasonId }
        : body.action === "report_issue"
          ? { reasonId: body.reasonId, description: body.description }
        : body.trackingNumber
          ? { trackingNumber: body.trackingNumber }
          : undefined;

    const order = await applyOrderAction(id, body.action, payload, auth.user.id);
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
