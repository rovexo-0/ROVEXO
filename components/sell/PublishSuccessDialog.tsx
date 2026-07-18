"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckLineIcon } from "@/components/icons/RvxLineIcons";
import { CanonicalButton } from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { focusRing } from "@/features/sell/ui/sell-classes";
import {
  getListingCanonicalPath,
  LISTING_LINK_COPIED_MESSAGE,
  LISTING_VIEW_ERROR_MESSAGE,
  type PublishSuccessPayload,
} from "@/lib/sell/publish-success";
import {
  trackPublishSuccessSellAnother,
  trackPublishSuccessShareListing,
  trackPublishSuccessViewListing,
} from "@/lib/sell/publish-analytics";

type PublishSuccessDialogProps = {
  open: boolean;
  publish: PublishSuccessPayload;
  onSellAnother: () => void | Promise<void>;
  onClose: () => void;
};

async function fetchImageFile(url: string, title: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const extension = blob.type.split("/")[1] || "jpg";
    return new File([blob], `${title.replace(/\s+/g, "-").slice(0, 40)}.${extension}`, {
      type: blob.type || "image/jpeg",
    });
  } catch {
    return null;
  }
}

/** PATCH 4 — post-publish success with fully functional actions. */
export function PublishSuccessDialog({
  open,
  publish,
  onSellAnother,
  onClose,
}: PublishSuccessDialogProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [viewError, setViewError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"view" | "share" | "another" | null>(null);

  const viewListing = useCallback(async () => {
    if (!publish.listingSlug?.trim()) {
      setViewError(LISTING_VIEW_ERROR_MESSAGE);
      return;
    }

    setBusy("view");
    setViewError(null);

    try {
      const path = getListingCanonicalPath(publish.listingSlug);
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

  const shareListing = useCallback(async () => {
    setBusy("share");
    setShareMessage(null);

    try {
      const shareData: ShareData = {
        title: publish.title,
        text: publish.title,
        url: publish.listingUrl,
      };

      if (publish.imageUrl) {
        const imageFile = await fetchImageFile(publish.imageUrl, publish.title);
        if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
          shareData.files = [imageFile];
        }
      }

      if (navigator.share) {
        await navigator.share(shareData);
        trackPublishSuccessShareListing(publish, "native");
        return;
      }

      await navigator.clipboard.writeText(publish.listingUrl);
      trackPublishSuccessShareListing(publish, "clipboard");
      pushToast({
        title: LISTING_LINK_COPIED_MESSAGE,
        variant: "success",
      });
      setShareMessage(LISTING_LINK_COPIED_MESSAGE);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(publish.listingUrl);
        trackPublishSuccessShareListing(publish, "clipboard");
        pushToast({
          title: LISTING_LINK_COPIED_MESSAGE,
          variant: "success",
        });
        setShareMessage(LISTING_LINK_COPIED_MESSAGE);
      } catch {
        pushToast({
          title: "Unable to share listing.",
          description: "Please copy the link manually.",
          variant: "error",
        });
      }
    } finally {
      setBusy(null);
    }
  }, [publish, pushToast]);

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
    <ModalContainer
      open
      onClose={onClose}
      variant="centered"
      zIndex={220}
      ariaLabel="Listing published"
      lockScroll
    >
      <div className="flex w-full max-w-none flex-col items-center gap-ds-4 p-ds-6 text-center">
        <span
          className="grid h-14 w-14 place-items-center rounded-ds-full bg-success/15 text-success"
          aria-hidden
        >
          <CheckLineIcon className="h-7 w-7" />
        </span>
        <div className="flex flex-col gap-ds-1">
          <h2 className="text-lg font-semibold text-text-primary">Listing published</h2>
          <p className="text-sm text-text-secondary">Your listing is now live.</p>
        </div>

        {viewError ? (
          <p className="w-full text-sm text-destructive" role="alert">
            {viewError}
          </p>
        ) : null}
        {shareMessage ? (
          <p className="w-full text-sm text-success" role="status">
            {shareMessage}
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-ds-2">
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
            loading={busy === "share"}
            disabled={busy !== null && busy !== "share"}
            onClick={() => void shareListing()}
          >
            Share Listing
          </CanonicalButton>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void sellAnother()}
            className={cn(
              "min-h-[44px] text-sm font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50",
              focusRing,
            )}
          >
            {busy === "another" ? "Starting new listing…" : "Sell Another Item"}
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
