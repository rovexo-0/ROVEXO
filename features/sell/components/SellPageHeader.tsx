import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

type SellPageHeaderProps = {
  onSaveDraft: () => void;
  draftSavedMessage?: string | null;
  editListingId?: string;
  quickMode?: boolean;
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function DraftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.875c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9H5.625c-.621 0-1.125.504-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
}

export function SellPageHeader({
  onSaveDraft,
  draftSavedMessage,
  editListingId,
  quickMode = false,
}: SellPageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 shadow-ds-soft backdrop-blur-xl backdrop-saturate-150">
      <div
        className={cn(
          "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
          "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
        )}
      >
        <IconButton
          href={editListingId ? "/seller/listings" : "/"}
          label={editListingId ? "Back to My Listings" : "Go back"}
          variant="ghost"
          size="md"
          className="justify-self-start"
        >
          <BackIcon className="h-5 w-5" />
        </IconButton>

        <h1 className="truncate text-center text-lg font-semibold text-text-primary">
          {editListingId ? "Edit Listing" : quickMode ? "Sell item" : "Sell"}
        </h1>

        <IconButton
          label="Save draft"
          variant="ghost"
          size="md"
          className="justify-self-end"
          onClick={onSaveDraft}
        >
          <DraftIcon className="h-5 w-5" />
        </IconButton>
      </div>

      {draftSavedMessage && (
        <p className="sr-only" aria-live="polite">
          {draftSavedMessage}
        </p>
      )}
    </header>
  );
}
