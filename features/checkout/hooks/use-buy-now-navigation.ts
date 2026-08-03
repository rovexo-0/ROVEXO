"use client";

import { useCallback, useRef } from "react";
import {
  isCanonicalBuyNowRvxCode,
  toBuyNowPublicMessage,
  RVX_UNCLASSIFIED,
  type RvxClassifiedCode,
} from "@/lib/checkout/buy-now-guard-v1";
import { RVX_LOG, RVX_LOG_CODE } from "@/lib/checkout/rvx-logger-v1";

const IDEMPOTENCY_STORAGE_PREFIX = "rvx_bn_idem_";

function readStoredIdempotency(productSlug: string): string | null {
  try {
    return sessionStorage.getItem(`${IDEMPOTENCY_STORAGE_PREFIX}${productSlug}`);
  } catch {
    return null;
  }
}

function storeIdempotency(productSlug: string, key: string): void {
  try {
    sessionStorage.setItem(`${IDEMPOTENCY_STORAGE_PREFIX}${productSlug}`, key);
  } catch {
    // sessionStorage may be unavailable — server still mints a stable key.
  }
}

export type BuyNowNavigationResult =
  | { ok: true; checkoutPath: string; productSlug: string }
  | { ok: false; code: RvxClassifiedCode; error: string; checkoutPath?: undefined };

/**
 * Buy Now → Checkout Guard. Returns checkout path only when ALL PASSes.
 * User errors = public Sorry copy only (never RVX in UI).
 */
export function useBuyNowNavigation() {
  const inFlightRef = useRef(false);

  const executeBuyNow = useCallback(
    async (input: {
      productSlug: string;
      bundleId?: string | null;
      offerId?: string | null;
      conversationId?: string | null;
      onError?: (message: string) => void;
    }): Promise<BuyNowNavigationResult> => {
      if (inFlightRef.current) {
        RVX_LOG("STOP", "double-click blocked");
        RVX_LOG_CODE("RVX-2012");
        // Silent ignore — never surface error UI for repeated clicks.
        return { ok: false, code: "RVX-2012", error: toBuyNowPublicMessage("RVX-2012") };
      }

      inFlightRef.current = true;
      RVX_LOG("BUY NOW STARTED");

      try {
        const idemKey = input.bundleId
          ? readStoredIdempotency(`bundle:${input.bundleId}`)
          : readStoredIdempotency(input.productSlug);
        const response = await fetch("/api/checkout/buy-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productSlug: input.productSlug,
            bundleId: input.bundleId ?? null,
            offerId: input.offerId ?? null,
            conversationId: input.conversationId ?? null,
            idempotencyKey: idemKey,
          }),
        });

        const payload = (await response.json()) as {
          success?: boolean;
          checkoutPath?: string;
          productSlug?: string;
          idempotencyKey?: string;
          code?: string;
          error?: string;
        };

        if (!response.ok || !payload.success || !payload.checkoutPath) {
          const rawCode = payload.code?.trim() ?? "";
          const code: RvxClassifiedCode =
            rawCode === RVX_UNCLASSIFIED || isCanonicalBuyNowRvxCode(rawCode)
              ? (rawCode as RvxClassifiedCode)
              : RVX_UNCLASSIFIED;
          RVX_LOG_CODE(code);
          const error =
            typeof payload.error === "string" && payload.error.trim()
              ? (payload.error.includes("\n")
                  ? (payload.error.split("\n").pop() ?? toBuyNowPublicMessage(code))
                  : payload.error)
              : toBuyNowPublicMessage(code);
          RVX_LOG("CHECKOUT BLOCKED");
          RVX_LOG("PAYMENT BLOCKED");
          RVX_LOG("FINISHED");
          input.onError?.(error);
          return { ok: false, code, error };
        }

        if (payload.idempotencyKey) {
          storeIdempotency(
            input.bundleId ? `bundle:${input.bundleId}` : input.productSlug,
            payload.idempotencyKey,
          );
        }

        return {
          ok: true,
          checkoutPath: payload.checkoutPath,
          productSlug: payload.productSlug ?? input.productSlug,
        };
      } catch {
        RVX_LOG_CODE(RVX_UNCLASSIFIED);
        const error = toBuyNowPublicMessage(RVX_UNCLASSIFIED);
        RVX_LOG("STOP");
        RVX_LOG("CHECKOUT BLOCKED");
        RVX_LOG("PAYMENT BLOCKED");
        RVX_LOG("FINISHED");
        input.onError?.(error);
        return { ok: false, code: RVX_UNCLASSIFIED, error };
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

  return { executeBuyNow };
}

/** Merge guard query onto canonical `/checkout/${slug}` path. Never cart. */
export function buildBuyNowCheckoutHref(productSlug: string, checkoutPath: string): string {
  const slug = productSlug.trim();
  const raw = checkoutPath.trim();
  if (!slug) {
    throw new Error("Buy Now checkout slug required");
  }
  if (
    raw.includes("/cart") ||
    raw.includes("/basket") ||
    raw.includes("/shopping-cart") ||
    raw.startsWith("cart")
  ) {
    throw new Error("Buy Now must never open cart");
  }
  const pathOnly = raw.split("?")[0] ?? "";
  if (pathOnly && !pathOnly.startsWith("/checkout")) {
    throw new Error("Buy Now must open /checkout only");
  }
  const base = `/checkout/${slug}`;
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return `${base}${q}`;
}
