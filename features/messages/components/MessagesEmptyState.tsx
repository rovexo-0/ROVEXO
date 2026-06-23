import { EmptyState } from "@/components/ui/EmptyState";
import { EmptyMessagesIcon } from "@/features/messages/icons";

export function MessagesEmptyState() {
  return (
    <EmptyState
      icon={<EmptyMessagesIcon className="h-7 w-7" />}
      title="No conversations yet"
      description="Message sellers about items you want to buy."
      actionLabel="Browse listings"
      actionHref="/search"
    />
  );
}
