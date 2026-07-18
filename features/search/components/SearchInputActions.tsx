"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ImageSearchCamera } from "@/components/home/ImageSearchCamera";
import { storeImageSearchQuery } from "@/lib/image-search/storage";

type SearchInputActionsProps = {
  /** Optional voice-search handler. When omitted, mic renders disabled. */
  onVoice?: () => void;
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
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-full text-text-muted hover:bg-secondary hover:text-text-primary",
        focusRing,
        transitionFast,
        !available && "opacity-45 hover:bg-transparent hover:text-text-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Search trailing actions — camera (image search) + optional voice. */
export function SearchInputActions({ onVoice, className }: SearchInputActionsProps) {
  const router = useRouter();
  const cameraInputId = useId();
  const [processing, setProcessing] = useState(false);

  async function handleImageSearchFiles(files: FileList) {
    const file = files[0];
    if (!file) return;
    setProcessing(true);
    try {
      const { fileToDataUrl } = await import("@/lib/image-search/similarity");
      const dataUrl = await fileToDataUrl(file);
      storeImageSearchQuery(dataUrl);
      router.push("/search?visual=1");
    } catch {
      // Cancelled or unreadable — stay on search.
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <ImageSearchCamera
        inputId={`${cameraInputId}-camera`}
        processing={processing}
        onFilesSelected={(files) => void handleImageSearchFiles(files)}
      />
      {onVoice ? (
        <ActionButton label="Voice search" available onClick={onVoice}>
          <MicIcon className="h-5 w-5" />
        </ActionButton>
      ) : null}
    </div>
  );
}
