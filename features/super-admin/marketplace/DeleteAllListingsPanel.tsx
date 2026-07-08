"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const DELETE_ENDPOINT = "/api/super-admin/marketplace/delete-all-listings";
const CONFIRM_WORD = "DELETE";

type DeleteReport = {
  total: number;
  deleted: number;
  failed: number;
  remaining: number;
};

type DeleteResponse = {
  ok?: boolean;
  message?: string;
  report?: DeleteReport;
  error?: string;
};

export function DeleteAllListingsPanel({ initialTotal }: { initialTotal: number }) {
  const [total, setTotal] = useState(initialTotal);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; report?: DeleteReport } | null>(null);

  const canExecute = confirmText.trim() === CONFIRM_WORD && !isPending;

  const closeDialog = useCallback(() => {
    if (isPending) return;
    setDialogOpen(false);
    setConfirmText("");
    setError(null);
  }, [isPending]);

  const execute = useCallback(() => {
    if (confirmText.trim() !== CONFIRM_WORD) return;
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(DELETE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: CONFIRM_WORD }),
        });
        const payload = (await response.json().catch(() => null)) as DeleteResponse | null;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Unable to delete listings.");
        }
        setResult({
          message: payload.message ?? "All listings deleted.",
          report: payload.report,
        });
        setTotal(payload.report?.remaining ?? 0);
        setDialogOpen(false);
        setConfirmText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete listings.");
      }
    });
  }, [confirmText]);

  return (
    <section className="rx-sheet mx-auto mt-ds-4 w-full max-w-2xl p-ds-5">
      <div className="rounded-ds-lg border border-danger/40 bg-danger/5 p-ds-4">
        <p className="text-title text-text-primary">Danger zone</p>
        <p className="mt-ds-2 text-body text-text-secondary">
          Permanently delete <strong>every listing</strong> in the marketplace, regardless of owner
          or status (Active, Draft, Pending, Paused, Sold, Expired, Rejected, Hidden, Archived).
          This runs the normal application delete flow for each listing, cascading all related
          images, favorites, views, cart references, metadata and caches. This action cannot be
          undone.
        </p>

        <p className="mt-ds-4 text-body text-text-primary">
          Listings currently in the marketplace: <strong>{total}</strong>
        </p>

        <div className="mt-ds-4">
          <Button
            type="button"
            variant="danger"
            disabled={total === 0 || isPending}
            onClick={() => {
              setResult(null);
              setError(null);
              setConfirmText("");
              setDialogOpen(true);
            }}
          >
            DELETE ALL LISTINGS
          </Button>
        </div>

        {result ? (
          <div className="mt-ds-4 rounded-ds-lg border border-border bg-surface p-ds-3" role="status">
            <p className="text-body text-text-primary">{result.message}</p>
            {result.report ? (
              <ul className="mt-ds-2 text-caption text-text-secondary">
                <li>Deleted: {result.report.deleted}</li>
                <li>Failed: {result.report.failed}</li>
                <li>Remaining: {result.report.remaining}</li>
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title="Delete ALL listings?"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={execute} disabled={!canExecute}>
              {isPending ? "Deleting…" : "Delete all listings"}
            </Button>
          </>
        }
      >
        <p>
          You are about to permanently delete <strong>{total}</strong> listing(s) across every
          account and status. All associated images, favorites, views, cart references, metadata and
          caches will be removed. This cannot be undone.
        </p>
        <label className="mt-ds-4 block text-caption text-text-secondary" htmlFor="confirm-delete-all">
          Type <strong>{CONFIRM_WORD}</strong> to confirm
        </label>
        <Input
          id="confirm-delete-all"
          className="mt-ds-2"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder={CONFIRM_WORD}
          autoComplete="off"
          disabled={isPending}
        />
        {error ? (
          <p className="mt-ds-2 text-caption text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </Dialog>
    </section>
  );
}
