"use client";

import { CanonicalMenuRow, CanonicalButton, CanonicalInput, CanonicalModal } from "@/src/components/canonical";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { AccountDeletionEligibility } from "@/lib/account/deletion-eligibility";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";


type DeleteAccountFlowProps = {
  className?: string;
  /** Centered destructive action below settings groups — no section card. */
  standalone?: boolean;
  /** Danger-zone menu row with icon, subtitle, and chevron. */
  dangerRow?: boolean;
};

export function DeleteAccountFlow({ className, standalone = false, dangerRow = false }: DeleteAccountFlowProps) {
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

  const openFlow = () => setStep(1);

  const row = dangerRow ? (
    <CanonicalMenuRow
      title="Delete Account"
      description="Permanently remove your account"
      destructive
      className={className}
      icon={<SettingsMenuIconGlyph name="logout" danger />}
      onClick={openFlow}
    />
  ) : standalone ? (
    <CanonicalButton variant="ghost" className={className} onClick={openFlow}>
      <span className="text-danger">Delete Account</span>
    </CanonicalButton>
  ) : (
    <CanonicalMenuRow title="Delete Account" destructive onClick={openFlow} className={className} />
  );

  const dialogs = (
    <>
      <CanonicalModal
        open={step === 1}
        variant="delete"
        title="Delete Account?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={() => {
          setStep(2);
          setPassword("");
          setError(null);
        }}
        onClose={() => setStep(0)}
      >
        <p className="text-sm text-text-secondary">
          Deleting your account is permanent. This action cannot be undone.
        </p>
      </CanonicalModal>

      <CanonicalModal
        open={step === 2}
        variant="delete"
        title="Confirm password"
        confirmLabel={isPending ? "Deleting…" : "Delete Account"}
        cancelLabel="Cancel"
        loading={isPending}
        confirmDisabled={isPending || !password || eligibility?.canDelete === false}
        onConfirm={() => void handleDelete()}
        onClose={() => setStep(0)}
      >
        <div className="flex flex-col gap-ds-3">
          <p className="text-sm text-text-secondary">
            Enter your password to permanently delete your ROVEXO account.
          </p>
          <CanonicalInput
            id="delete-account-password"
            label="Enter Password"
            inputType="password"
            autoComplete="current-password"
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
      </CanonicalModal>
    </>
  );

  return (
    <>
      {row}
      {dialogs}
    </>
  );
}
