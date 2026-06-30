import Image from "next/image";
import { cn } from "@/lib/cn";
import { MessageStatusIcon } from "@/features/messages/icons";
import { formatMessageTime } from "@/lib/messages/utils";
import type { ChatMessage } from "@/lib/messages/types";

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isBuyer = message.senderRole === "buyer";

  return (
    <div className={cn("flex w-full", isBuyer ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[75%] flex-col gap-ds-1", isBuyer ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-ds-lg px-ds-3 py-ds-2 text-sm leading-relaxed",
            isBuyer
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-surface-muted text-text-primary",
          )}
        >
          {message.kind === "photo" ? (
            <div className="relative h-40 w-56 max-w-full overflow-hidden rounded-ds-md">
              <Image src={message.content} alt="Shared photo" fill className="object-cover" sizes="224px" />
            </div>
          ) : (
            <p className="break-words">{message.content}</p>
          )}
        </div>

        <div className="flex items-center gap-ds-1 text-[0.625rem] text-text-muted">
          <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
          {isBuyer && <MessageStatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
