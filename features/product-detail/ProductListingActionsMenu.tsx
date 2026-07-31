"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CanonicalModal } from "@/src/components/canonical";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { editListingHref } from "@/lib/sell/canonical-edit-listing-engine-v1";
import { getListingShareUrl } from "@/lib/share/listing-url";
import type { ProductStatus } from "@/lib/supabase/types/database";

type ProductListingActionsMenuProps = {
  isOwner: boolean;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  listingStatus: ProductStatus | string;
  sellerId: string;
  sellerName: string;
  sellerUsername: string | null;
};

const LISTING_REPORT_REASONS = [
  "Counterfeit or fake item",
  "Unsafe product",
  "Illegal or prohibited item",
  "Scam or misleading listing",
  "Intellectual property infringement",
  "Other",
] as const;

const SELLER_REPORT_REASONS = [
  "Scam or fraud",
  "Counterfeit sales",
  "Harassment",
  "Unsafe or illegal activity",
  "Other",
] as const;

/**
 * Listing Details ••• menu — seller actions XOR buyer actions.
 */
export function ProductListingActionsMenu({
  isOwner,
  listingId,
  listingSlug,
  listingTitle,
  listingStatus,
  sellerId,
  sellerName,
  sellerUsername,
}: ProductListingActionsMenuProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportListingOpen, setReportListingOpen] = useState(false);
  const [reportSellerOpen, setReportSellerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const status = String(listingStatus);
  const canPause = status === "published";
  const canRelist = status === "paused" || status === "sold";
  const canMarkSold = status === "published" || status === "paused";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const postStatus = useCallback(
    async (action: "pause" | "reactivate" | "sold") => {
      setBusy(true);
      setOpen(false);
      try {
        const response = await fetch(`/api/listings/${listingId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to update listing.", variant: "error" });
          return;
        }
        const labels = {
          pause: "Listing paused.",
          reactivate: "Listing relisted.",
          sold: "Listing marked as sold.",
        } as const;
        pushToast({ title: labels[action], variant: "success" });
        router.refresh();
      } catch {
        pushToast({ title: "Unable to update listing.", variant: "error" });
      } finally {
        setBusy(false);
      }
    },
    [listingId, pushToast, router],
  );

  const confirmDelete = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (!response.ok) {
        pushToast({ title: "Unable to delete listing.", variant: "error" });
        return;
      }
      setDeleteOpen(false);
      pushToast({ title: "Listing deleted.", variant: "success" });
      router.push("/seller/listings");
      router.refresh();
    } catch {
      pushToast({ title: "Unable to delete listing.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }, [listingId, pushToast, router]);

  const shareListing = useCallback(async () => {
    setOpen(false);
    const url = getListingShareUrl(listingSlug);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: listingTitle, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      pushToast({ title: "Link copied.", variant: "success" });
    } catch {
      pushToast({ title: "Unable to share listing.", variant: "error" });
    }
  }, [listingSlug, listingTitle, pushToast]);

  const blockSeller = useCallback(async () => {
    setOpen(false);
    if (!sellerUsername) {
      pushToast({ title: "Unable to block seller.", variant: "error" });
      return;
    }
    try {
      const response = await fetch("/api/account/blocked-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: sellerUsername }),
      });
      if (!response.ok) {
        pushToast({ title: "Unable to block seller.", variant: "error" });
        return;
      }
      pushToast({ title: "Seller blocked.", variant: "success" });
    } catch {
      pushToast({ title: "Unable to block seller.", variant: "error" });
    }
  }, [pushToast, sellerUsername]);

  return (
    <div className="relative" ref={menuRef} data-listing-actions-menu={isOwner ? "seller" : "buyer"}>
      <button
        type="button"
        className="pd-v1__chrome-btn"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="pd-v1__chrome-menu" aria-hidden>
          •••
        </span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-30 mt-ds-1 min-w-[200px] overflow-hidden rounded-ds-lg border border-border bg-background shadow-ds-md"
          role="menu"
        >
          {isOwner ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  router.push(editListingHref(listingId));
                }}
              >
                Edit Listing
              </button>
              {canMarkSold ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                  onClick={() => void postStatus("sold")}
                >
                  Mark as Sold
                </button>
              ) : null}
              {canPause ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                  onClick={() => void postStatus("pause")}
                >
                  Pause Listing
                </button>
              ) : null}
              {canRelist ? (
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                  onClick={() => void postStatus("reactivate")}
                >
                  Relist
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="block w-full px-ds-4 py-ds-3 text-left text-sm text-danger hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  setDeleteOpen(true);
                }}
              >
                Delete Listing
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  setReportListingOpen(true);
                }}
              >
                Report Listing
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  setReportSellerOpen(true);
                }}
              >
                Report Seller
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                onClick={() => void blockSeller()}
              >
                Block Seller
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                onClick={() => void shareListing()}
              >
                Share
              </button>
            </>
          )}
        </div>
      ) : null}

      <CanonicalModal
        open={deleteOpen}
        variant="delete"
        title="Delete Listing"
        cancelLabel="Cancel"
        confirmLabel={busy ? "Deleting…" : "Delete"}
        loading={busy}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      >
        <p className="text-sm text-text-secondary">This action cannot be undone.</p>
      </CanonicalModal>

      <ReportModal
        open={reportListingOpen}
        title="Report Listing"
        subject={listingTitle}
        reasons={LISTING_REPORT_REASONS}
        onClose={() => setReportListingOpen(false)}
        onSubmit={async (reason, message) => {
          const response = await fetch("/api/listings/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productSlug: listingSlug,
              reason,
              message: message.trim() || undefined,
            }),
          });
          if (!response.ok) throw new Error("report_failed");
          pushToast({ title: "Report submitted. Our team will review it.", variant: "success" });
        }}
      />

      <ReportModal
        open={reportSellerOpen}
        title="Report Seller"
        subject={sellerName}
        reasons={SELLER_REPORT_REASONS}
        onClose={() => setReportSellerOpen(false)}
        onSubmit={async (reason, message) => {
          const response = await fetch("/api/users/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sellerId,
              reason,
              message: message.trim() || undefined,
            }),
          });
          if (!response.ok) throw new Error("report_failed");
          pushToast({ title: "Seller report submitted.", variant: "success" });
        }}
      />
    </div>
  );
}

function ReportModal({
  open,
  title,
  subject,
  reasons,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  subject: string;
  reasons: readonly string[];
  onClose: () => void;
  onSubmit: (reason: string, message: string) => Promise<void>;
}) {
  if (!open) return null;
  return (
    <ReportModalBody
      key={`${title}-open`}
      title={title}
      subject={subject}
      reasons={reasons}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function ReportModalBody({
  title,
  subject,
  reasons,
  onClose,
  onSubmit,
}: {
  title: string;
  subject: string;
  reasons: readonly string[];
  onClose: () => void;
  onSubmit: (reason: string, message: string) => Promise<void>;
}) {
  const { pushToast } = useToast();
  const [reason, setReason] = useState(reasons[0] ?? "Other");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(reason, message);
      onClose();
    } catch {
      pushToast({ title: "Unable to submit report.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-sm text-text-secondary">
        Report <strong>{subject}</strong>.
      </p>
      <label className="mt-ds-4 flex flex-col gap-ds-2 text-sm">
        <span className="font-medium text-text-primary">Reason</span>
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="rx-input min-h-ds-7 px-ds-3 py-ds-2"
        >
          {reasons.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-ds-4 flex flex-col gap-ds-2 text-sm">
        <span className="font-medium text-text-primary">Additional details (optional)</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={1000}
          className="rx-input px-ds-3 py-ds-2"
          placeholder="Describe the issue"
        />
      </label>
      <div className="mt-ds-6 flex justify-end gap-ds-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? "Sending…" : "Submit Report"}
        </Button>
      </div>
    </Modal>
  );
}
