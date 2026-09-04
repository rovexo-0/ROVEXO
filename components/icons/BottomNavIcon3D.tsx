import type { ReactNode } from "react";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import {
  ChatLineIcon,
  SearchLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import type { BottomNavIconType } from "@/lib/icons/bottom-nav-icon-type";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export type { BottomNavIconType };

type BottomNavIcon3DProps = {
  type: BottomNavIconType;
  active?: boolean;
  className?: string;
  /** Tab icons render at 32px; sell stays at 34px inside the sell button. */
  size?: "tab" | "sell";
};

const TAB_ICON_PX = 32;
const SELL_ICON_PX = 34;

/** Absolute Final: platform emoji — no Fluency 3D assets. */
export function BottomNavIcon3D({ type, active, className, size = "tab" }: BottomNavIcon3DProps) {
  const px = size === "sell" ? SELL_ICON_PX : TAB_ICON_PX;
  const iconClass = cn(
    "h-full w-full transition-opacity duration-200",
    active ? "opacity-100" : "opacity-90",
    className,
  );

  let icon: ReactNode;
  switch (type) {
    case "home":
      icon = <PlatformEmoji emoji={PLATFORM_EMOJI.home} size={px} className={iconClass} />;
      break;
    case "search":
      icon = <SearchLineIcon className={iconClass} width={px} height={px} />;
      break;
    case "sell":
      icon = <PlatformEmoji emoji={PLATFORM_EMOJI.plus} size={px} className={iconClass} />;
      break;
    case "saved":
      icon = <ChatLineIcon className={iconClass} width={px} height={px} />;
      break;
    case "account":
      icon = <UserLineIcon className={iconClass} width={px} height={px} />;
      break;
    default:
      icon = <PlatformEmoji emoji={PLATFORM_EMOJI.home} size={px} className={iconClass} />;
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-current"
      style={{ width: px, height: px }}
      aria-hidden
    >
      {icon}
    </span>
  );
}
