import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import type { BottomNavIconType } from "@/lib/icons/bottom-nav-icon-type";
import { cn } from "@/lib/cn";

const ICON_CLASS = "h-5 w-5";

type BottomNavV2IconProps = {
  type: BottomNavIconType;
  href: string;
  className?: string;
};

/** Bottom Nav — global emoji icons (20px). */
export function BottomNavV2Icon({ type, href, className }: BottomNavV2IconProps) {
  const iconClass = cn("rx-bottom-nav-v2-icon", ICON_CLASS, className);

  if (href.startsWith("/inbox") || href.startsWith("/messages") || type === "saved") {
    return <PlatformEmoji emoji={PLATFORM_EMOJI.inbox} className={iconClass} />;
  }

  switch (type) {
    case "home":
      return <PlatformEmoji emoji={PLATFORM_EMOJI.home} className={iconClass} />;
    case "search":
      return <PlatformEmoji emoji={PLATFORM_EMOJI.browse} className={iconClass} />;
    case "account":
      return <PlatformEmoji emoji={PLATFORM_EMOJI.account} className={iconClass} />;
    default:
      return <PlatformEmoji emoji={PLATFORM_EMOJI.home} className={iconClass} />;
  }
}
