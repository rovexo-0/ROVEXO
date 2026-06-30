import { EmptyState } from "@/components/ui/EmptyState";

export function SavedEmptyState() {
  return (
    <EmptyState
      premiumIllustrationId="wishlist"
      title="Nothing saved yet"
      description="Save items you love and find them quickly here."
      actionLabel="Start shopping"
      actionHref="/"
    />
  );
}
