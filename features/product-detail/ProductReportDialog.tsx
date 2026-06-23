"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ProductReportDialogProps = {
  productSlug: string;
};

export function ProductReportDialog({ productSlug }: ProductReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("misleading");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submitReport() {
    setStatus("loading");
    try {
      const response = await fetch("/api/listings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, reason, message }),
      });
      if (!response.ok) throw new Error("Failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-text-secondary underline-offset-2 hover:text-danger hover:underline"
      >
        Report listing
      </button>

      {open && (
        <div
          className="premium-sheet-overlay fixed inset-0 z-[200] flex items-end justify-center p-ds-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
        >
          <div className="premium-sheet premium-enter w-full max-w-md p-ds-5">
            <h2 id="report-dialog-title" className="text-lg font-semibold text-text-primary">
              Report listing
            </h2>
            <p className="mt-ds-1 text-sm text-text-secondary">
              Tell us why this listing should be reviewed.
            </p>

            {status === "done" ? (
              <p className="mt-ds-4 text-sm font-medium text-primary">
                Thanks — our team will review this listing.
              </p>
            ) : (
              <>
                <label className="mt-ds-4 flex flex-col gap-ds-1 text-sm text-text-secondary">
                  Reason
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="premium-input min-h-ds-7 px-ds-3 text-text-primary"
                  >
                    <option value="misleading">Misleading description</option>
                    <option value="counterfeit">Counterfeit or replica</option>
                    <option value="prohibited">Prohibited item</option>
                    <option value="spam">Spam or scam</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="mt-ds-3 flex flex-col gap-ds-1 text-sm text-text-secondary">
                  Details (optional)
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={3}
                    className="premium-input min-h-[88px] px-ds-3 py-ds-2 text-text-primary"
                  />
                </label>
                {status === "error" && (
                  <p className="mt-ds-2 text-sm text-danger">Unable to submit report. Try again.</p>
                )}
                <div className="mt-ds-4 flex gap-ds-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={status === "loading"}
                    onClick={() => void submitReport()}
                  >
                    {status === "loading" ? "Submitting…" : "Submit report"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
