import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  addToCart,
  clearCart,
  getCartSummary,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart/store";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const cart = await getCartSummary(auth.user.id);
  return NextResponse.json({ cart });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as {
    action?: "add" | "remove" | "clear" | "update";
    productSlug?: string;
    quantity?: number;
  };

  if (body.action === "clear") {
    await clearCart(auth.user.id);
    const cart = await getCartSummary(auth.user.id);
    return NextResponse.json({ success: true, cart });
  }

  if (!body.productSlug) {
    return NextResponse.json({ success: false, error: "Product is required." }, { status: 400 });
  }

  if (body.action === "remove") {
    await removeFromCart(auth.user.id, body.productSlug);
    const cart = await getCartSummary(auth.user.id);
    return NextResponse.json({ success: true, cart });
  }

  if (body.action === "update") {
    const result = await updateCartQuantity(auth.user.id, body.productSlug, body.quantity ?? 1);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    const cart = await getCartSummary(auth.user.id);
    return NextResponse.json({ success: true, cart });
  }

  const result = await addToCart(auth.user.id, body.productSlug);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  const cart = await getCartSummary(auth.user.id);
  return NextResponse.json({ success: true, cart });
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const productSlug = new URL(request.url).searchParams.get("productSlug");
  if (productSlug) {
    await removeFromCart(auth.user.id, productSlug);
  } else {
    await clearCart(auth.user.id);
  }

  const cart = await getCartSummary(auth.user.id);
  return NextResponse.json({ success: true, cart });
}
