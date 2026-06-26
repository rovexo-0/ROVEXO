"use client";

import { useCallback, useEffect, useRef } from "react";
import { MIGRATION_POLL_INTERVAL_MS } from "@/lib/seller/migration/engine/config";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import type { MigrationJob } from "@/lib/seller/migration/types";

type UseMigrationPollOptions = {
  jobId: string | null;
  enabled: boolean;
  onUpdate: (job: MigrationJob) => void;
  onComplete: (job: MigrationJob) => void;
};

export function useMigrationPoll({
  jobId,
  enabled,
  onUpdate,
  onComplete,
}: UseMigrationPollOptions) {
  const onUpdateRef = useRef(onUpdate);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onCompleteRef.current = onComplete;
  }, [onUpdate, onComplete]);

  const poll = useCallback(async () => {
    if (!jobId) return;
    const response = await fetch(`/api/seller/migration/${jobId}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { job: MigrationJob };
    onUpdateRef.current(payload.job);

    if (payload.job.status === "completed" || payload.job.status === "failed") {
      onCompleteRef.current(payload.job);
      return;
    }

    if (payload.job.status === "queued" || payload.job.status === "processing") {
      await fetch(`/api/seller/migration/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process" }),
      }).catch(() => undefined);
    }
  }, [jobId]);

  useVisibilityPolling(
    () => {
      if (enabled && jobId) void poll();
    },
    MIGRATION_POLL_INTERVAL_MS,
    { immediate: true, refreshOnVisible: true },
  );
}
