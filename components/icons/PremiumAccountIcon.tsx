import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { cn } from "@/lib/cn";
import type { AccountPremiumIconKey } from "@/lib/account-center/premium-icons";

type PremiumAccountIconProps = {
  icon: AccountPremiumIconKey;
  /** Rendered square size in px. */
  size?: number;
  className?: string;
  priority?: boolean;
};

const PREMIUM_TO_ACCOUNT: Record<AccountPremiumIconKey, AccountIconName> = {
  shopping: "cart",
  wallet: "wallet",
  security: "security",
  analytics: "reviews",
  marketplace: "business",
  feedback: "ideas",
  response: "messages",
  orders: "orders",
  cases: "support",
  listings: "listings",
  messages: "messages",
  business: "business",
  seller: "listings",
  buyer: "cart",
  settings: "settings",
  help: "help",
  notification: "notifications",
  eye: "profile",
  calendar: "orders",
  saved: "saved",
};

/** Absolute Final: AccountIcon line glyphs — no premium account WebP/PNG assets. */
export function PremiumAccountIcon({ icon, size = 40, className, priority: _priority = false }: PremiumAccountIconProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center text-current", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <AccountIcon name={PREMIUM_TO_ACCOUNT[icon]} className="h-full w-full" />
    </span>
  );
}

export type { AccountPremiumIconKey };
