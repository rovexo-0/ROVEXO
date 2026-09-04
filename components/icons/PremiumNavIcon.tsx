import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export type PremiumNavIconType = "home" | "search" | "sell" | "saved" | "account";

type PremiumNavIconProps = {
  type: PremiumNavIconType;
  size?: number;
  className?: string;
  priority?: boolean;
};

const NAV_EMOJI: Record<PremiumNavIconType, string> = {
  home: PLATFORM_EMOJI.home,
  search: PLATFORM_EMOJI.search,
  sell: PLATFORM_EMOJI.add,
  saved: PLATFORM_EMOJI.inbox,
  account: PLATFORM_EMOJI.account,
};

export function PremiumNavIcon({ type, size = 28, className }: PremiumNavIconProps) {
  void className;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-current"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <PlatformEmoji emoji={NAV_EMOJI[type] ?? PLATFORM_EMOJI.home} width={size} height={size} />
    </span>
  );
}
