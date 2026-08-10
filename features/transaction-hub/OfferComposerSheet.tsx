"use client";

/* P0-01: page-scoped Make Offer CSS — not loaded via platform index. */
import "@/styles/rovexo/make-offer-v1.css";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { trackTransactionHubMakeOffer } from "@/lib/transaction-hub/analytics";
import type { OfferComposerProduct } from "@/lib/transaction-hub/product-action-bar";
import {
  MAKE_OFFER_FREEZE_V1,
  calculateOfferFromDiscount,
  formatOfferAmount,
  parseOfferAmount,
  sanitizeOfferInput,
} from "@/lib/transaction-hub/make-offer-freeze-v1";

/** Optional Bundle context — same POST /api/offers path; server remains authority. */
export type OfferComposerBundleContext = {
  bundleId: string;
  sellerId: string;
  sellerName: string;
  currency?: string;
  lines: Array<{
    productId: string;
    slug: string;
    title: string;
    imageUrl: string;
    unitPrice: number;
    quantity: number;
    maxStock: number;
  }>;
};

type OfferComposerSheetProps = {
  open: boolean;
  onClose: () => void;
  product: OfferComposerProduct;
  conversationId?: string;
  /** When set, % discounts use product.price as bundle list total; submit sends bundle body. */
  bundle?: OfferComposerBundleContext;
  onOfferSent?: (context: { conversationHref?: string }) => void;
};

type OfferMode = "off5" | "off10" | "custom";

type OfferComposerBodyProps = {
  product: OfferComposerProduct;
  conversationId?: string;
  bundle?: OfferComposerBundleContext;
  onClose: () => void;
  onOfferSent?: (context: { conversationHref?: string }) => void;
};

/**
 * Fresh mount per open — resets custom/amount without useEffect setState.
 */
function OfferComposerBody({
  product,
  conversationId,
  bundle,
  onClose,
  onOfferSent,
}: OfferComposerBodyProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<OfferMode>("custom");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** List total used for 5%/10% presets (single listing or whole bundle). */
  const listPrice = product.price;

  const price5 = useMemo(
    () => calculateOfferFromDiscount(listPrice, 0.05),
    [listPrice],
  );
  const price10 = useMemo(
    () => calculateOfferFromDiscount(listPrice, 0.1),
    [listPrice],
  );

  const selectPreset = useCallback(
    (next: OfferMode) => {
      setMode(next);
      if (next === "off5") {
        setAmount(price5.toFixed(2));
        return;
      }
      if (next === "off10") {
        setAmount(price10.toFixed(2));
        return;
      }
      setAmount("");
    },
    [price10, price5],
  );

  const handleSubmit = useCallback(async () => {
    const parsed = parseOfferAmount(amount);
    if (parsed == null) {
      pushToast({ title: "Enter a valid offer amount.", variant: "error" });
      return;
    }

    if (parsed >= listPrice) {
      pushToast({
        title: bundle
          ? "Offer must be below the bundle listing total."
          : "Offer must be below the listing price.",
        variant: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          bundle
            ? {
                amount: parsed,
                bundle: {
                  bundleId: bundle.bundleId,
                  sellerId: bundle.sellerId,
                  sellerName: bundle.sellerName,
                  currency: bundle.currency,
                  lines: bundle.lines,
                },
              }
            : {
                productSlug: product.slug,
                amount: parsed,
                conversationId,
              },
        ),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        href?: string;
      };

      if (!response.ok || !payload.success) {
        pushToast({
          title: payload.error ?? "Unable to submit offer.",
          variant: "error",
        });
        return;
      }

      trackTransactionHubMakeOffer(
        {
          conversationId: conversationId ?? (bundle ? "bundle-review" : "product-detail"),
          productSlug: product.slug,
          productId: product.id,
        },
        parsed,
      );

      let conversationHref: string | undefined = payload.href;
      if (!conversationHref && !bundle) {
        try {
          const chatResponse = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ productSlug: product.slug }),
          });
          const chatPayload = (await chatResponse.json()) as { href?: string };
          conversationHref = chatPayload.href;
        } catch {
          conversationHref = undefined;
        }
      }

      pushToast({
        title: "Offer sent",
        description: "Continue the conversation in chat.",
        variant: "success",
      });

      setAmount("");
      setMode("custom");
      onClose();

      if (onOfferSent) {
        onOfferSent({ conversationHref });
        return;
      }

      if (conversationHref) {
        router.push(conversationHref);
      }
    } catch {
      pushToast({
        title: "Unable to submit offer.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    amount,
    bundle,
    conversationId,
    listPrice,
    onClose,
    onOfferSent,
    product.id,
    product.slug,
    pushToast,
    router,
  ]);

  return (
    <div
      className="mo-v1__sheet"
      data-make-offer={MAKE_OFFER_FREEZE_V1.version}
      data-make-offer-freeze="FINAL_FREEZE"
      data-bundle-make-offer={bundle ? "true" : undefined}
    >
      <header className="mo-v1__header">
        <button type="button" className="mo-v1__close" onClick={onClose} disabled={submitting}>
          Close
        </button>
      </header>

      <div className="mo-v1__product">
        <div className="mo-v1__thumb">
          <SafeImage
            src={product.imageUrl}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        </div>
        <div className="mo-v1__product-meta">
          <p className="mo-v1__title">{product.title}</p>
          <p className="mo-v1__price">{formatOfferAmount(listPrice)}</p>
        </div>
      </div>

      <div className="mo-v1__presets" role="group" aria-label="Offer presets">
        <button
          type="button"
          className={cn("mo-v1__preset", mode === "off5" && "mo-v1__preset--active")}
          onClick={() => selectPreset("off5")}
          disabled={submitting}
        >
          <span className="mo-v1__preset-amount">{formatOfferAmount(price5)}</span>
          <span className="mo-v1__preset-label">5% off</span>
        </button>
        <button
          type="button"
          className={cn("mo-v1__preset", mode === "off10" && "mo-v1__preset--active")}
          onClick={() => selectPreset("off10")}
          disabled={submitting}
        >
          <span className="mo-v1__preset-amount">{formatOfferAmount(price10)}</span>
          <span className="mo-v1__preset-label">10% off</span>
        </button>
        <button
          type="button"
          className={cn("mo-v1__preset", mode === "custom" && "mo-v1__preset--active")}
          onClick={() => selectPreset("custom")}
          disabled={submitting}
        >
          <span className="mo-v1__preset-amount">Custom</span>
          <span className="mo-v1__preset-label">Set a price</span>
        </button>
      </div>

      <label className="mo-v1__amount">
        <span className="mo-v1__currency" aria-hidden>
          £
        </span>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Offer amount"
          placeholder="0.00"
          className="mo-v1__input"
          value={amount}
          disabled={submitting}
          onFocus={() => {
            if (mode !== "custom") setMode("custom");
          }}
          onChange={(event) => {
            setMode("custom");
            setAmount(sanitizeOfferInput(event.target.value));
          }}
        />
      </label>

      <button
        type="button"
        className="mo-v1__submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
        onClick={() => void handleSubmit()}
      >
        {submitting ? "Submitting…" : "Submit Offer"}
      </button>
    </div>
  );
}

/**
 * Make Offer — Cod Sânge v1.0 FINAL FREEZE.
 * Close · Image · Title · £ · 5%/10%/Custom · input · Submit Offer.
 * Optional `bundle` reuses the same UI; POST /api/offers with existing bundle body.
 */
export function OfferComposerSheet({
  open,
  onClose,
  product,
  conversationId,
  bundle,
  onOfferSent,
}: OfferComposerSheetProps) {
  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="sheet"
      zIndex={210}
      ariaLabel="Make an offer"
      lockScroll
      panelClassName="mo-v1"
    >
      {open ? (
        <OfferComposerBody
          key={`${bundle?.bundleId ?? product.id}-open`}
          product={product}
          conversationId={conversationId}
          bundle={bundle}
          onClose={onClose}
          onOfferSent={onOfferSent}
        />
      ) : null}
    </ModalContainer>
  );
}
