"use client";

import { CanonicalConfirmDialog } from "@/src/components/canonical/dialogs/CanonicalConfirmDialog";

type DraftRecoveryDialogProps = {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
};

/** SELL-106 — resume or discard a locally saved sell draft. */
export function DraftRecoveryDialog({ open, onContinue, onDiscard }: DraftRecoveryDialogProps) {
  return (
    <CanonicalConfirmDialog
      open={open}
      onClose={onDiscard}
      onConfirm={onContinue}
      title="Continue draft?"
      description="You have an unfinished listing. Would you like to continue where you left off?"
      confirmLabel="Continue"
      cancelLabel="Discard"
    />
  );
}
