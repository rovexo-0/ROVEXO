"use client";

import { publishPhaseLabel, type PublishPhase } from "@/lib/sell/publish-engine";

type PublishingOverlayProps = {
  phase: PublishPhase;
  uploadProgress: number;
  isEdit?: boolean;
};

/** SELL-108 — publish phase label above the fixed bar. */
export function PublishingOverlay({ phase, uploadProgress, isEdit = false }: PublishingOverlayProps) {
  if (phase === "idle" || phase === "published" || phase === "error") return null;

  const label = publishPhaseLabel(phase, { uploadProgress, isEdit });
  const showBar = phase === "uploading" && uploadProgress > 0;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(var(--sell-publish-bar-measured,72px))] z-[109] border-t border-border bg-white/95 px-[var(--cds-space-page-x)] py-ds-2 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      data-sell-publish-phase={phase}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-ds-2">
        <p className="text-center text-sm font-medium text-text-primary">{label}</p>
        {showBar ? (
          <div className="h-1.5 overflow-hidden rounded-ds-full bg-surface-muted">
            <div
              className="h-full rounded-ds-full bg-primary transition-[width] duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function usePublishPhaseLabel(
  phase: PublishPhase,
  uploadProgress: number,
  isEdit?: boolean,
): string {
  return publishPhaseLabel(phase, { uploadProgress, isEdit });
}
