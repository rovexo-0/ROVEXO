import { Card } from "@/components/ui/Card";
import { EmptyMessagesIcon } from "@/features/messages/icons";

export function MessagesEmptyState() {
  return (
    <Card padding="lg" className="flex flex-col items-center gap-ds-3 py-ds-8 text-center shadow-ds-soft">
      <span className="flex h-16 w-16 items-center justify-center rounded-ds-full bg-surface-muted text-text-muted">
        <EmptyMessagesIcon className="h-8 w-8" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-text-primary">No conversations yet</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">Start shopping to contact sellers.</p>
      </div>
    </Card>
  );
}
