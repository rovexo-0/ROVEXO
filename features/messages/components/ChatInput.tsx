"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { CameraIcon, PlusIcon } from "@/features/messages/icons";

type ChatInputProps = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || sending || disabled) return;

    setSending(true);
    try {
      await onSend(content);
      setValue("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-surface/95 px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))] shadow-ds-floating backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-end gap-ds-2">
        <IconButton label="Add attachment" variant="ghost" size="md" disabled={disabled}>
          <PlusIcon className="h-5 w-5" />
        </IconButton>

        <IconButton label="Camera" variant="ghost" size="md" disabled={disabled}>
          <CameraIcon className="h-5 w-5" />
        </IconButton>

        <label className="sr-only" htmlFor="chat-message-input">
          Type a message
        </label>
        <input
          id="chat-message-input"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Type a message..."
          disabled={disabled || sending}
          className={cn(
            "min-h-[56px] flex-1 rounded-ds-full border border-border bg-surface-muted px-ds-4 py-ds-3 text-sm text-text-primary placeholder:text-text-muted",
            focusRing,
          )}
        />

        <Button
          variant="primary"
          size="md"
          className="min-h-ds-7 shrink-0 rounded-ds-full px-ds-5"
          disabled={disabled || sending || !value.trim()}
          onClick={() => void handleSend()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
