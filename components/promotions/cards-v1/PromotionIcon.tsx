import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import type { PromotionIconId } from "@/lib/promotions/catalog";

type PromotionIconProps = {
  icon: PromotionIconId;
};

const PROMOTION_ICON_EMOJI: Record<PromotionIconId, string> = {
  "arrow-up": "📈",
  star: PLATFORM_EMOJI.star,
  rocket: "🚀",
  crown: "👑",
  storefront: PLATFORM_EMOJI.store,
};

export function PromotionIcon({ icon }: PromotionIconProps) {
  const emoji = PROMOTION_ICON_EMOJI[icon];
  if (!emoji) return null;
  return <PlatformEmoji emoji={emoji} size={24} />;
}
