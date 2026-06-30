import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { BackIcon } from "@/features/product-detail/icons";
import { MoreIcon } from "@/features/messages/icons";
import { getPresenceLabel } from "@/lib/messages/utils";
import type { Conversation } from "@/lib/messages/types";

type ChatHeaderProps = {
  conversation: Conversation;
};

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const { participant } = conversation;

  return (
    <header className="rx-page-header sticky top-0 z-50">
      <div className="flex items-center gap-ds-2 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        <IconButton href="/messages" label="Back to messages" variant="ghost" size="md">
          <BackIcon className="h-5 w-5" />
        </IconButton>

        <Avatar
          src={participant.avatarUrl}
          alt={participant.name}
          name={participant.name}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{participant.name}</p>
          <p className="truncate text-xs text-text-secondary">{getPresenceLabel(conversation)}</p>
        </div>

        <IconButton label="Conversation options" variant="ghost" size="md">
          <MoreIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </header>
  );
}
