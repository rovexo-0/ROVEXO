import { enqueueHubAction, flushHubActionQueue } from "@/lib/transaction-hub/action-queue";

type AddToCartResult =
  | { success: true; alreadyInCart?: boolean; queued?: boolean }
  | { success: false; error: string };

/** Optimistic in-chat / PDP add to cart — badge refresh is caller responsibility. */
export async function addToCartFromHub(productSlug: string): Promise<AddToCartResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueHubAction({ type: "add_to_cart", productSlug });
    return { success: true, queued: true };
  }

  try {
    const inCart = await isProductInCart(productSlug);
    if (inCart) {
      return { success: true, alreadyInCart: true };
    }

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", productSlug }),
    });
    const payload = (await response.json()) as { success?: boolean; error?: string };

    if (!response.ok || !payload.success) {
      return { success: false, error: payload.error ?? "Unable to add to cart." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Unable to add to cart." };
  }
}

export async function isProductInCart(productSlug: string): Promise<boolean> {
  try {
    const response = await fetch("/api/cart");
    if (!response.ok) return false;
    const payload = (await response.json()) as {
      cart?: { items?: Array<{ slug: string }> };
    };
    return (payload.cart?.items ?? []).some((item) => item.slug === productSlug);
  } catch {
    return false;
  }
}

export async function fetchCartSummary(): Promise<{
  itemCount: number;
  subtotal: number;
} | null> {
  try {
    const response = await fetch("/api/cart");
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      cart?: { itemCount: number; subtotal: number };
    };
    return payload.cart ?? null;
  } catch {
    return null;
  }
}

export { flushHubActionQueue };
