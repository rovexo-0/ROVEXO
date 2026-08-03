"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatListingPrice } from "@/lib/listing-card/format";
import {
  BUNDLE_SELLER_CONFLICT_COPY,
  bundleItemCount,
  bundleSubtotal,
  type BundleLineItemV1,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-domain-v1";
import { readBundleMirror, writeBundleMirror } from "@/lib/bundle/bundle-mirror-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  bundle: BundleSnapshotV1;
  line: BundleLineItemV1;
};

/**
 * Add to Bundle confirmation — 320px · 220ms · no redirect on open.
 */
export function AddToBundleSheet({ open, onClose, bundle, line }: SheetProps) {
  if (!open) return null;

  const last = bundle.items.find((item) => item.productId === line.productId) ?? line;
  const count = bundleItemCount(bundle);
  const total = bundleSubtotal(bundle);

  return (
    <div
      className="pd-v1__bundle-sheet-root"
      role="dialog"
      aria-modal="true"
      aria-label="Added to Bundle"
      data-bundle-sheet-ms={BUNDLE_ENGINE_V1.viewItemExtension.sheetAnimMs}
    >
      <button type="button" className="pd-v1__bundle-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="pd-v1__bundle-sheet" data-bundle-sheet>
        <p className="pd-v1__bundle-sheet-ok" style={{ color: "var(--ds-color-primary, #9333ea)" }}>
          ✓ Added to Bundle
        </p>
        <div className="pd-v1__bundle-sheet-product">
          <div className="pd-v1__bundle-sheet-thumb">
            <SafeImage src={last.imageUrl} alt="" width={56} height={56} className="pd-v1__bundle-sheet-img" />
          </div>
          <div className="pd-v1__bundle-sheet-copy">
            <p className="pd-v1__bundle-sheet-title">{last.title}</p>
            <p className="pd-v1__bundle-sheet-qty">
              Qty {last.quantity} · {formatListingPrice(last.unitPrice * last.quantity)}
            </p>
          </div>
        </div>
        <div className="pd-v1__bundle-sheet-summary">
          <span>
            Bundle · {count} {count === 1 ? "Item" : "Items"}
          </span>
          <strong>{formatListingPrice(total)}</strong>
        </div>
        <div className="pd-v1__bundle-sheet-actions">
          <button type="button" className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--secondary" onClick={onClose}>
            Continue Shopping
          </button>
          <Link
            href={BUNDLE_ENGINE_V1.ssot.reviewRoute}
            className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--primary"
            onClick={onClose}
          >
            Review Bundle
          </Link>
        </div>
      </div>
    </div>
  );
}

type ConflictProps = {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
};

export function BundleSellerConflictDialog({ open, onContinue, onCancel }: ConflictProps) {
  if (!open) return null;
  return (
    <div
      className="pd-v1__bundle-conflict-root"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bundle-conflict-title"
    >
      <button type="button" className="pd-v1__bundle-sheet-backdrop" aria-label="Dismiss" onClick={onCancel} />
      <div className="pd-v1__bundle-conflict">
        <h2 id="bundle-conflict-title" className="pd-v1__bundle-conflict-title">
          Active bundle
        </h2>
        <p className="pd-v1__bundle-conflict-body">{BUNDLE_SELLER_CONFLICT_COPY}</p>
        <div className="pd-v1__bundle-sheet-actions">
          <button type="button" className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="pd-v1__bundle-sheet-btn pd-v1__bundle-sheet-btn--primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export function useActiveBundle(): BundleSnapshotV1 | null {
  const [bundle, setBundle] = useState<BundleSnapshotV1 | null>(null);

  useEffect(() => {
    let cancelled = false;
    let hydrateGen = 0;
    const syncMirror = () => {
      // Invalidate in-flight GET so a stale response cannot overwrite a fresh mutation.
      hydrateGen += 1;
      setBundle(readBundleMirror());
    };

    const hydrate = async () => {
      const gen = ++hydrateGen;
      try {
        const res = await fetch("/api/bundle", { credentials: "include" });
        if (cancelled || gen !== hydrateGen) return;
        if (res.status === 401) {
          writeBundleMirror(null);
          setBundle(null);
          return;
        }
        if (!res.ok) {
          // Fail closed: do not trust stale cache after failed hydrate.
          writeBundleMirror(null);
          setBundle(null);
          return;
        }
        const payload = (await res.json()) as { ok?: boolean; bundle?: BundleSnapshotV1 | null };
        if (cancelled || gen !== hydrateGen) return;
        if (payload.ok) {
          writeBundleMirror(payload.bundle ?? null);
          setBundle(payload.bundle ?? null);
          return;
        }
        writeBundleMirror(null);
        setBundle(null);
      } catch {
        if (!cancelled && gen === hydrateGen) {
          writeBundleMirror(null);
          setBundle(null);
        }
      }
    };

    // Server snapshot first — mirror is cache only after hydrate.
    void hydrate();

    window.addEventListener("rovexo:bundle-sync", syncMirror);
    window.addEventListener("storage", syncMirror);
    return () => {
      cancelled = true;
      window.removeEventListener("rovexo:bundle-sync", syncMirror);
      window.removeEventListener("storage", syncMirror);
    };
  }, []);

  return bundle;
}
