"use client";

import { useCallback, useEffect, useRef } from "react";
import { MIGRATION_POLL_INTERVAL_MS } from "@/lib/seller/migration/engine/config";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import type { MigrationJob } from "@/lib/seller/migration/types";

type UseMigrationPublishPollOptions = {
  jobId: string | null;
  enabled: boolean;
  onUpdate: (job: MigrationJob) => void;
  onComplete: (job: MigrationJob) => void;
};

export function useMigrationPublishPoll({
  jobId,
  enabled,
  onUpdate,
  onComplete,
}: UseMigrationPublishPollOptions) {
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

    const publishDone =
      payload.job.publishStatus === "completed" ||
      payload.job.publishStatus === "failed" ||
      payload.job.publishStatus === "cancelled";

    if (publishDone) {
      onCompleteRef.current(payload.job);
      return;
    }

    if (payload.job.publishStatus === "queued" || payload.job.publishStatus === "publishing") {
      await fetch(`/api/seller/migration/${jobId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
