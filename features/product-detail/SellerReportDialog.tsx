"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const REPORT_REASONS = [
  "Scam or fraud",
  "Counterfeit sales",
  "Harassment",
  "Unsafe or illegal activity",
  "Other",
] as const;

type SellerReportDialogProps = {
  sellerId: string;
  sellerName: string;
};

export function SellerReportDialog({ sellerId, sellerName }: SellerReportDialogProps) {
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/users/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, reason, message: message.trim() || undefined }),
      });
      if (!response.ok) {
        pushToast({ title: "Unable to submit report.", variant: "error" });
        return;
      }
      pushToast({ title: "Seller report submitted.", variant: "success" });
      setOpen(false);
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="pd-v1__report-link" onClick={() => setOpen(true)}>
        Report Seller
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Report Seller">
        <p className="text-sm text-text-secondary">
          Report <strong>{sellerName}</strong>. Reports are reviewed by ROVEXO moderation.
        </p>

        <label className="mt-ds-4 flex flex-col gap-ds-2 text-sm">
          <span className="font-medium text-text-primary">Reason</span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value as (typeof REPORT_REASONS)[number])}
            className="rx-input min-h-ds-7 px-ds-3 py-ds-2"
          >
            {REPORT_REASONS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-ds-4 flex flex-col gap-ds-2 text-sm">
          <span className="font-medium text-text-primary">Details (optional)</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            maxLength={1000}
            className="rx-input px-ds-3 py-ds-2"
          />
        </label>

        <div className="mt-ds-6 flex justify-end gap-ds-3">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Sending…" : "Submit Report"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
