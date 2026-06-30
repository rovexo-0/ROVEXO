import { EmptyState } from "@/components/ui/EmptyState";

export function MessagesEmptyState() {
  return (
    <EmptyState
      premiumIllustrationId="messages"
      title="No conversations yet"
      description="Message sellers about items you want to buy."
      actionLabel="Browse listings"
      actionHref="/search"
    />
  );
}
