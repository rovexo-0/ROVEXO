"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { AccountDeletionEligibility } from "@/lib/account/deletion-eligibility";

type DeleteAccountFlowProps = {
  className?: string;
};

export function DeleteAccountFlow({ className }: DeleteAccountFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<AccountDeletionEligibility | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (step !== 2) return;
    void fetch("/api/account/delete")
      .then((response) => response.json())
      .then((payload: AccountDeletionEligibility) => setEligibility(payload))
      .catch(() => setEligibility({ canDelete: false, blockers: [] }));
  }, [step]);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        blockers?: AccountDeletionEligibility["blockers"];
      };

      if (!response.ok) {
        if (payload.blockers?.length) {
          setEligibility({ canDelete: false, blockers: payload.blockers });
        }
        setError(payload.error ?? "Unable to delete account.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  };

  return (
    <>
      <section className={cn("acm-settings__section acm-settings__section--danger", className)}>
        <h2 className="acm-settings__heading acm-settings__heading--danger">Delete Account</h2>
        <div className="acm-settings__card acm-settings__card--danger">
          <button
            type="button"
            className={cn("acm-settings__row acm-settings__row--danger", focusRing)}
            onClick={() => setStep(1)}
          >
            <span className="acm-settings__label">Delete Account</span>
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={step === 1}
        title="Delete Account?"
        description="Deleting your account is permanent. This action cannot be undone."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setStep(2);
          setPassword("");
          setError(null);
        }}
        onCancel={() => setStep(0)}
      />

      <ConfirmDialog
        open={step === 2}
        title="Confirm password"
        description="Enter your password to permanently delete your ROVEXO account."
        confirmLabel={isPending ? "Deleting…" : "Delete Account"}
        cancelLabel="Cancel"
        destructive
        confirmDisabled={isPending || !password || eligibility?.canDelete === false}
        onConfirm={() => void handleDelete()}
        onCancel={() => setStep(0)}
      >
        <div className="mt-4 space-y-3">
          <label htmlFor="delete-account-password" className="block text-sm font-medium">
            Enter Password
          </label>
          <input
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {eligibility && !eligibility.canDelete ? (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              <p className="font-medium">
                Your account cannot be deleted until all active activity has been completed.
              </p>
              <ul className="mt-2 list-disc pl-5">
                {eligibility.blockers.map((blocker) => (
                  <li key={blocker.code}>{blocker.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </ConfirmDialog>
    </>
  );
}
