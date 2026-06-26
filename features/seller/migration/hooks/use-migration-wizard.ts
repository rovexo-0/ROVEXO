"use client";

import { useCallback, useMemo, useState } from "react";
import { MIGRATION_IMPORT_METHODS, MIGRATION_PLATFORMS } from "@/lib/seller/migration/constants";
import { buildPreviewItems } from "@/lib/seller/migration/preview";
import { useMigrationPoll } from "@/features/seller/migration/hooks/use-migration-poll";
import type {
  MigrationImportMethodId,
  MigrationJob,
  MigrationPlatformId,
  MigrationPreviewItem,
  MigrationWizardStep,
} from "@/lib/seller/migration/types";

type MigrationWizardState = {
  step: MigrationWizardStep;
  platform: MigrationPlatformId | null;
  importMethod: MigrationImportMethodId | null;
  jobId: string | null;
  job: MigrationJob | null;
  previewItems: MigrationPreviewItem[];
  isSubmitting: boolean;
  isPolling: boolean;
  error: string | null;
};

export function useMigrationWizard() {
  const [state, setState] = useState<MigrationWizardState>({
    step: 1,
    platform: null,
    importMethod: null,
    jobId: null,
    job: null,
    previewItems: [],
    isSubmitting: false,
    isPolling: false,
    error: null,
  });

  const platformLabel = useMemo(
    () => MIGRATION_PLATFORMS.find((item) => item.id === state.platform)?.name ?? "Marketplace",
    [state.platform],
  );

  const methodLabel = useMemo(
    () => MIGRATION_IMPORT_METHODS.find((item) => item.id === state.importMethod)?.name ?? "Import",
    [state.importMethod],
  );

  const handlePollUpdate = useCallback((job: MigrationJob) => {
    setState((current) => ({ ...current, job }));
  }, []);

  const handlePollComplete = useCallback((job: MigrationJob) => {
    setState((current) => ({
      ...current,
      job,
      isPolling: false,
      isSubmitting: false,
      step: 5,
    }));
  }, []);

  useMigrationPoll({
    jobId: state.jobId,
    enabled: state.isPolling,
    onUpdate: handlePollUpdate,
    onComplete: handlePollComplete,
  });

  const selectPlatform = useCallback((platform: MigrationPlatformId) => {
    setState((current) => ({ ...current, platform, error: null }));
  }, []);

  const selectImportMethod = useCallback((importMethod: MigrationImportMethodId) => {
    setState((current) => ({ ...current, importMethod, error: null }));
  }, []);

  const goToStep = useCallback((step: MigrationWizardStep) => {
    setState((current) => ({ ...current, step, error: null }));
  }, []);

  const goNext = useCallback(() => {
    setState((current) => {
      if (current.step >= 5) return current;
      const next = (current.step + 1) as MigrationWizardStep;

      if (current.step === 2 && current.platform && current.importMethod) {
        return {
          ...current,
          step: next,
          previewItems: buildPreviewItems(
            MIGRATION_PLATFORMS.find((p) => p.id === current.platform)?.name ?? "Marketplace",
            MIGRATION_IMPORT_METHODS.find((m) => m.id === current.importMethod)?.name ?? "Import",
          ),
        };
      }

      return { ...current, step: next };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((current) => {
      if (current.step <= 1) return current;
      return { ...current, step: (current.step - 1) as MigrationWizardStep, error: null };
    });
  }, []);

  const createJob = useCallback(async () => {
    if (!state.platform || !state.importMethod) return;

    setState((current) => ({ ...current, isSubmitting: true, error: null }));
    try {
      const response = await fetch("/api/seller/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: state.platform,
          importMethod: state.importMethod,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to prepare migration.");
      }

      const payload = (await response.json()) as { job: MigrationJob };
      setState((current) => ({
        ...current,
        jobId: payload.job.id,
        job: payload.job,
        step: 4,
        isSubmitting: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Unable to prepare migration.",
      }));
    }
  }, [state.platform, state.importMethod]);

  const startMigration = useCallback(async () => {
    if (!state.jobId) return;

    setState((current) => ({ ...current, isSubmitting: true, isPolling: true, error: null }));
    try {
      const response = await fetch(`/api/seller/migration/${state.jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Migration failed.");
      }

      const payload = (await response.json()) as { job: MigrationJob };
      setState((current) => ({
        ...current,
        job: payload.job,
        isSubmitting: false,
        isPolling: payload.job.status !== "completed" && payload.job.status !== "failed",
        step: payload.job.status === "completed" ? 5 : 4,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        isPolling: false,
        error: error instanceof Error ? error.message : "Migration failed.",
      }));
    }
  }, [state.jobId]);

  const reset = useCallback(() => {
    setState({
      step: 1,
      platform: null,
      importMethod: null,
      jobId: null,
      job: null,
      previewItems: [],
      isSubmitting: false,
      isPolling: false,
      error: null,
    });
  }, []);

  const canAdvanceFromStep1 = state.platform !== null;
  const canAdvanceFromStep2 = state.importMethod !== null;

  return {
    ...state,
    platformLabel,
    methodLabel,
    selectPlatform,
    selectImportMethod,
    goToStep,
    goNext,
    goBack,
    createJob,
    startMigration,
    reset,
    canAdvanceFromStep1,
    canAdvanceFromStep2,
  };
}
