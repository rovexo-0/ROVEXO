import { publishPhaseLabel, type PublishPhase } from "@/lib/sell/publish-engine";

type PublishingOverlayProps = {
  phase: PublishPhase;
  uploadProgress: number;
  isEdit?: boolean;
};

/**
 * Blood XXI Priority II — clear publish feedback so the user never asks
 * “Did my item publish?” / “Why is nothing happening?”
 */
export function PublishingOverlay({ phase, uploadProgress, isEdit = false }: PublishingOverlayProps) {
  if (phase === "idle" || phase === "published" || phase === "error") return null;

  const label = publishPhaseLabel(phase, { uploadProgress, isEdit });
  const showBar = phase === "uploading" && uploadProgress > 0;

  return (
    <div
      className="fixed inset-0 z-[109] flex flex-col items-center justify-center bg-white/85 px-[var(--cds-space-page-x)] backdrop-blur-[2px]"
      role="status"
      aria-live="assertive"
      aria-busy="true"
      data-sell-publish-phase={phase}
      data-blood-code-xxi-publish="1"
    >
      <div className="flex w-full max-w-none flex-col items-center gap-ds-4 pb-[var(--sell-sticky-clearance,96px)]">
        <span
          className="h-10 w-10 animate-spin rounded-ds-full border-[3px] border-primary border-t-transparent"
          aria-hidden
        />
        <p className="text-center text-base font-semibold text-text-primary">{label}</p>
        {showBar ? (
          <div className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-ds-full bg-surface-muted">
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
