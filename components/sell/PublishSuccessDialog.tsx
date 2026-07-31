"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { CanonicalButton } from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { cn } from "@/lib/cn";
import { focusRing } from "@/features/sell/ui/sell-classes";
import {
  getListingCanonicalPath,
  LISTING_VIEW_ERROR_MESSAGE,
  type PublishSuccessPayload,
} from "@/lib/sell/publish-success";
import {
  trackPublishSuccessSellAnother,
  trackPublishSuccessShareListing,
  trackPublishSuccessViewListing,
} from "@/lib/sell/publish-analytics";
import { waitListingViewReadyMs } from "@/lib/sell/listing-view-readiness-v1";

type PublishSuccessDialogProps = {
  open: boolean;
  publish: PublishSuccessPayload;
  onSellAnother: () => void | Promise<void>;
  onClose: () => void;
  /** Absolute Authority L7 — X dismisses to Homepage. */
  onDismissToHome?: () => void;
};

/** Absolute Authority L7 + Blood XXI — X · Photo · Listing successfully published · View · Share · Sell Another. */
export function PublishSuccessDialog({
  open,
  publish,
  onSellAnother,
  onClose,
  onDismissToHome,
}: PublishSuccessDialogProps) {
  const router = useRouter();
  const [viewError, setViewError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState<"view" | "another" | null>(null);

  const photoSrc = publish.imageUrl?.trim() || null;

  const dismissToHome = useCallback(() => {
    onClose();
    if (onDismissToHome) {
      onDismissToHome();
      return;
    }
    router.push("/");
  }, [onClose, onDismissToHome, router]);

  const viewListing = useCallback(async () => {
    if (!publish.listingSlug?.trim()) {
      setViewError(LISTING_VIEW_ERROR_MESSAGE);
      return;
    }

    setBusy("view");
    setViewError(null);

    try {
      const path = getListingCanonicalPath(publish.listingSlug);
      // Soft readiness — avoid racing RSC before the listing is readable.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const probe = await fetch(path, { credentials: "same-origin", cache: "no-store" });
          if (probe.ok) break;
        } catch {
          /* retry */
        }
        await waitListingViewReadyMs(250);
      }
      trackPublishSuccessViewListing(publish);
      router.push(path);
      router.refresh();
      onClose();
    } catch {
      try {
        window.location.assign(getListingCanonicalPath(publish.listingSlug));
        onClose();
      } catch {
        setViewError(LISTING_VIEW_ERROR_MESSAGE);
      }
    } finally {
      setBusy(null);
    }
  }, [onClose, publish, router]);

  const openShare = useCallback(() => {
    trackPublishSuccessShareListing(publish, "sheet");
    setShareOpen(true);
  }, [publish]);

  const sellAnother = useCallback(async () => {
    setBusy("another");
    try {
      trackPublishSuccessSellAnother(publish);
      await onSellAnother();
      onClose();
    } catch {
      await onSellAnother();
      onClose();
    } finally {
      setBusy(null);
    }
  }, [onClose, onSellAnother, publish]);

  if (!open) return null;

  return (
    <>
      <ModalContainer
        open
        onClose={dismissToHome}
        variant="centered"
        zIndex={220}
        ariaLabel="Listing successfully published"
        lockScroll
      >
        <div className="relative flex w-full max-w-none flex-col items-center gap-ds-4 p-ds-6 text-center">
          <button
            type="button"
            aria-label="Close"
            onClick={dismissToHome}
            className={cn(
              "absolute right-ds-3 top-ds-3 grid h-11 w-11 place-items-center rounded-ds-full text-xl leading-none text-text-primary",
              focusRing,
            )}
          >
            ×
          </button>

          {photoSrc ? (
            <div className="relative h-[120px] w-[80px] overflow-hidden rounded-[16px] bg-surface-muted">
              <SafeImage
                src={photoSrc}
                alt={publish.title || "Listing photo"}
                fill
                className="object-cover object-center"
                sizes="80px"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-ds-1 pt-ds-2">
            <h2 className="text-lg font-semibold text-text-primary">
              Listing successfully published
            </h2>
            <p className="text-sm text-text-secondary">Your listing is now live.</p>
          </div>

          {viewError ? (
            <p className="w-full text-sm text-destructive" role="alert">
              {viewError}
            </p>
          ) : null}

          <div className="flex w-full flex-col gap-ds-2" data-blood-code-xxi-success="1">
            <CanonicalButton
              fullWidth
              loading={busy === "view"}
              disabled={busy !== null && busy !== "view"}
              onClick={() => void viewListing()}
            >
              View Listing
            </CanonicalButton>
            <CanonicalButton
              fullWidth
              variant="outline"
              disabled={busy !== null}
              onClick={openShare}
            >
              Share Listing
            </CanonicalButton>
            <CanonicalButton
              fullWidth
              variant="ghost"
              loading={busy === "another"}
              disabled={busy !== null && busy !== "another"}
              onClick={() => void sellAnother()}
            >
              Sell Another Item
            </CanonicalButton>
          </div>
        </div>
      </ModalContainer>

      <ShareListingSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={publish.title}
        slug={publish.listingSlug}
        productId={publish.listingId}
        imageUrl={publish.imageUrl}
      />
    </>
  );
}
