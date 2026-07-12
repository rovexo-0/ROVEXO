"use client";

import { useCallback, useState } from "react";
import {
  detectRecoverableDraft,
  discardLocalDraft,
  loadLocalDraftForRestore,
} from "@/lib/sell/draft-engine";

export function useDraftListing(options: { enabled: boolean; restoreDraft?: boolean }) {
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkRecovery = useCallback(async (): Promise<boolean> => {
    if (!options.enabled || options.restoreDraft || checked) return false;
    setChecked(true);
    const recoverable = await detectRecoverableDraft();
    if (recoverable) setRecoveryOpen(true);
    return recoverable;
  }, [checked, options.enabled, options.restoreDraft]);

  return {
    recoveryOpen,
    setRecoveryOpen,
    checkRecovery,
    discardDraft: async () => {
      await discardLocalDraft();
      setRecoveryOpen(false);
    },
    loadDraft: loadLocalDraftForRestore,
  };
}
