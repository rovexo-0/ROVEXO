import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export function PublishedCheckmark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sell-published-check flex h-20 w-20 items-center justify-center rounded-ds-full bg-success/10",
        className,
      )}
    >
      <PlatformEmoji emoji={PLATFORM_EMOJI.check} size={40} className="text-success" />
    </div>
  );
}
