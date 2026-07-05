"use client";

import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type SearchInputActionsProps = {
  /**
   * Optional voice-search handler. When omitted, the mic button renders in a
   * "coming soon" state. Speech recognition itself is intentionally NOT wired
   * here — this is the component/architecture hook only.
   */
  onVoice?: () => void;
  /**
   * Optional camera / barcode handler. When omitted, the camera button renders
   * in a "coming soon" state. OCR / barcode scanning is intentionally NOT wired
   * here — this is the component/architecture hook only.
   */
  onCamera?: () => void;
  className?: string;
};

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 11a6 6 0 0 1-12 0M12 18v3" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 7 8 4.5h8L17.5 7H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7h2.5Z" />
      <circle cx="12" cy="13" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionButton({
  label,
  available,
  onClick,
  children,
}: {
  label: string;
  available: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={available ? onClick : undefined}
      aria-label={available ? label : `${label} (coming soon)`}
      aria-disabled={!available}
      title={available ? label : `${label} — coming soon`}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-full text-text-muted hover:bg-secondary hover:text-text-primary",
        focusRing,
        transitionFast,
        !available && "opacity-45 hover:bg-transparent hover:text-text-muted",
      )}
    >
      {children}
    </button>
  );
}

export function SearchInputActions({ onVoice, onCamera, className }: SearchInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <ActionButton label="Voice search" available={Boolean(onVoice)} onClick={onVoice}>
        <MicIcon className="h-5 w-5" />
      </ActionButton>
      <ActionButton label="Search by photo or barcode" available={Boolean(onCamera)} onClick={onCamera}>
        <CameraIcon className="h-5 w-5" />
      </ActionButton>
    </div>
  );
}
