"use client";

import { useCallback, useMemo, useState } from "react";
import {
  isPlatformImportReady,
  resolveDefaultImportMethod,
  resolvePlatformFlow,
} from "@/lib/bring-your-item/platform-flow";
import { previewHasBlockingErrors } from "@/lib/bring-your-item/inline-import-engine";
import { MIGRATION_PLATFORMS } from "@/lib/seller/migration/constants";
import { useInlineImportPreview } from "@/features/seller/migration/hooks/use-inline-import-preview";
import { useMigrationPoll } from "@/features/seller/migration/hooks/use-migration-poll";
import type {
  MigrationImportMethodId,
  MigrationJob,
  MigrationPlatformId,
  MigrationQueueItem,
  MigrationWizardStep,
} from "@/lib/seller/migration/types";
import {
  buildMigrationInputPayload,
  hasMigrationSourceInput,
  type MigrationSourceInput,
} from "@/features/seller/migration/components/MigrationSourceFields";

type MigrationWizardState = {
  step: MigrationWizardStep;
  platform: MigrationPlatformId | null;
  importMethod: MigrationImportMethodId | null;
  source: MigrationSourceInput;
  jobId: string | null;
  job: MigrationJob | null;
  queueItems: MigrationQueueItem[];
  isSubmitting: boolean;
  isPolling: boolean;
  error: string | null;
};

const EMPTY_SOURCE: MigrationSourceInput = {
  storeUrl: "",
  sourceUrls: "",
  fileName: null,
  fileContent: null,
};

type UseMigrationWizardOptions = {
  initialPlatform?: MigrationPlatformId | null;
  resumeJobId?: string | null;
  isPlatformConnected?: (platform: MigrationPlatformId) => boolean;
};

export function useMigrationWizard(options: UseMigrationWizardOptions = {}) {
  const [state, setState] = useState<MigrationWizardState>(() => {
    const platform = options.initialPlatform ?? null;
    return {
      step: options.resumeJobId ? 3 : platform ? 2 : 1,
      platform,
      importMethod: platform ? resolveDefaultImportMethod(platform) : null,
      source: EMPTY_SOURCE,
      jobId: options.resumeJobId ?? null,
      job: null,
      queueItems: [],
      isSubmitting: Boolean(options.resumeJobId),
      isPolling: Boolean(options.resumeJobId),
      error: null,
    };
  });

  const platformLabel = useMemo(
    () =>
      resolvePlatformFlow(state.platform ?? "ebay")?.name ??
      MIGRATION_PLATFORMS.find((item) => item.id === state.platform)?.name ??
      "Marketplace",
    [state.platform],
  );

  const platformFlow = useMemo(
    () => (state.platform ? resolvePlatformFlow(state.platform) : null),
    [state.platform],
  );

  const loadQueueItems = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/seller/migration/${jobId}/items`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items: MigrationQueueItem[] };
    return payload.items;
  }, []);

  const handlePollUpdate = useCallback((job: MigrationJob) => {
    setState((current) => ({
      ...current,
      job,
      platform: current.platform ?? job.platform,
      importMethod: current.importMethod ?? job.importMethod,
    }));
  }, []);

  const handlePollComplete = useCallback(
    async (job: MigrationJob) => {
      const items = await loadQueueItems(job.id);
      setState((current) => ({
        ...current,
        job,
        queueItems: items,
        isPolling: false,
        isSubmitting: false,
        step: 3,
      }));
    },
    [loadQueueItems],
  );

  useMigrationPoll({
    jobId: state.jobId,
    enabled: state.isPolling,
    onUpdate: handlePollUpdate,
    onComplete: (job) => {
      void handlePollComplete(job);
    },
  });

  const selectPlatform = useCallback((platform: MigrationPlatformId) => {
    setState((current) => ({
      ...current,
      platform,
      importMethod: resolveDefaultImportMethod(platform),
      source: EMPTY_SOURCE,
      step: 2,
      error: null,
      job: null,
      jobId: null,
      queueItems: [],
      isSubmitting: false,
      isPolling: false,
    }));
  }, []);

  const updateSource = useCallback((patch: Partial<MigrationSourceInput>) => {
    setState((current) => ({ ...current, source: { ...current.source, ...patch }, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((current) => ({ ...current, error }));
  }, []);

  const setQueueItems = useCallback((queueItems: MigrationQueueItem[]) => {
    setState((current) => ({ ...current, queueItems }));
  }, []);

  const goBack = useCallback(() => {
    setState((current) => {
      if (current.step <= 1) return current;
      if (current.step === 3 && (current.isPolling || current.isSubmitting)) return current;
      return {
        ...current,
        step: (current.step - 1) as MigrationWizardStep,
        error: null,
        job: current.step === 3 ? null : current.job,
        jobId: current.step === 3 ? null : current.jobId,
        queueItems: current.step === 3 ? [] : current.queueItems,
        isPolling: false,
        isSubmitting: false,
      };
    });
  }, []);

  const isConnected = state.platform
    ? (options.isPlatformConnected?.(state.platform) ?? false)
    : false;

  const inlinePreviewState = useInlineImportPreview({
    importMethod: state.importMethod,
    source: state.source,
    platformLabel,
    isOAuthReady: isConnected && state.importMethod === "api_import",
    enabled: state.step === 2,
  });

  const createAndStartJob = useCallback(async () => {
    if (!state.platform || !state.importMethod) return null;

    const response = await fetch("/api/seller/migration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: state.platform,
        importMethod: state.importMethod,
        input: buildMigrationInputPayload(state.importMethod, state.source),
        start: true,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Unable to start import.");
    }

    const payload = (await response.json()) as { job: MigrationJob };
    return payload.job;
  }, [state.platform, state.importMethod, state.source]);

  const startImport = useCallback(async () => {
    if (!state.platform || !state.importMethod) return;

    const connected = state.platform ? (options.isPlatformConnected?.(state.platform) ?? false) : false;
    if (
      !isPlatformImportReady(state.platform, {
        connected,
        hasSourceInput: hasMigrationSourceInput(state.importMethod, state.source),
      })
    ) {
      setState((current) => ({
        ...current,
        error: "Complete the connection or add your import source before continuing.",
      }));
      return;
    }

    if (inlinePreviewState.previewError) {
      setState((current) => ({
        ...current,
        error: inlinePreviewState.previewError ?? "Preview failed.",
      }));
      return;
    }

    if (previewHasBlockingErrors(inlinePreviewState.preview)) {
      setState((current) => ({
        ...current,
        error: "Fix validation issues in the preview before importing.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isSubmitting: true,
      isPolling: true,
      error: null,
      step: 3,
    }));

    try {
      const job = await createAndStartJob();
      if (!job) throw new Error("Unable to start import.");

      setState((current) => ({
        ...current,
        jobId: job.id,
        job,
        isSubmitting: false,
        isPolling: job.status !== "completed" && job.status !== "failed",
        step: 3,
      }));

      if (job.status === "completed" || job.status === "failed") {
        const items = await loadQueueItems(job.id);
        setState((current) => ({
          ...current,
          queueItems: items,
          isPolling: false,
        }));
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        isPolling: false,
        step: 2,
        error: error instanceof Error ? error.message : "Import failed.",
      }));
    }
  }, [createAndStartJob, inlinePreviewState.preview, inlinePreviewState.previewError, loadQueueItems, options, state.importMethod, state.platform, state.source]);

  const resumeJob = useCallback(async (jobId: string) => {
    setState((current) => ({
      ...current,
      jobId,
      step: 3,
      isSubmitting: true,
      isPolling: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/seller/migration/${jobId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to resume import.");

      const payload = (await response.json()) as { job: MigrationJob };
      const job = payload.job;
      const items = job.status === "completed" ? await loadQueueItems(job.id) : [];

      setState((current) => ({
        ...current,
        platform: job.platform,
        importMethod: job.importMethod,
        job,
        jobId: job.id,
        queueItems: items,
        isSubmitting: false,
        isPolling: job.status !== "completed" && job.status !== "failed",
        step: 3,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        isPolling: false,
        step: 1,
        error: error instanceof Error ? error.message : "Unable to resume import.",
      }));
    }
  }, [loadQueueItems]);

  const cancelImport = useCallback(async () => {
    const jobId = state.jobId;
    if (jobId) {
      await fetch(`/api/seller/migration/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }).catch(() => undefined);
    }

    setState((current) => ({
      ...current,
      isPolling: false,
      isSubmitting: false,
      step: 2,
      job: null,
      jobId: null,
      queueItems: [],
      error: null,
    }));
  }, [state.jobId]);

  const retryImport = useCallback(async () => {
    setState((current) => ({
      ...current,
      job: null,
      jobId: null,
      queueItems: [],
      error: null,
    }));
    await startImport();
  }, [startImport]);

  const reset = useCallback(() => {
    setState({
      step: 1,
      platform: null,
      importMethod: null,
      source: EMPTY_SOURCE,
      jobId: null,
      job: null,
      queueItems: [],
      isSubmitting: false,
      isPolling: false,
      error: null,
    });
  }, []);

  const canStartImport =
    state.platform &&
    state.importMethod &&
    !inlinePreviewState.isPreviewing &&
    !inlinePreviewState.previewError &&
    !previewHasBlockingErrors(inlinePreviewState.preview)
      ? isPlatformImportReady(state.platform, {
          connected: isConnected,
          hasSourceInput: hasMigrationSourceInput(state.importMethod, state.source),
        })
      : false;

  const importComplete = state.job?.status === "completed";
  const importFailed = state.job?.status === "failed";

  return {
    ...state,
    platformLabel,
    platformFlow,
    inlinePreview: inlinePreviewState.preview,
    isPreviewing: inlinePreviewState.isPreviewing,
    previewError: inlinePreviewState.previewError,
    selectPlatform,
    updateSource,
    goBack,
    startImport,
    resumeJob,
    cancelImport,
    retryImport,
    reset,
    setError,
    setQueueItems,
    canStartImport,
    isConnected,
    importComplete,
    importFailed,
  };
}
