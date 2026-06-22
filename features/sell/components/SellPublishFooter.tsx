import { Button } from "@/components/ui/Button";

type SellPublishFooterProps = {
  disabled: boolean;
  loading: boolean;
  onPublish: () => void;
  editListingId?: string;
  quickMode?: boolean;
};

export function SellPublishFooter({
  disabled,
  loading,
  onPublish,
  editListingId,
  quickMode = false,
}: SellPublishFooterProps) {
  const actionLabel = editListingId ? "Save Changes" : quickMode ? "Publish" : "Publish Listing";
  const loadingLabel = editListingId ? "Saving…" : "Publishing…";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] border-t border-border bg-surface/95 shadow-ds-floating backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-2xl px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="min-h-ds-7 rounded-ds-lg text-base"
          disabled={disabled || loading}
          onClick={onPublish}
        >
          {loading ? loadingLabel : actionLabel}
        </Button>
      </div>
    </div>
  );
}
