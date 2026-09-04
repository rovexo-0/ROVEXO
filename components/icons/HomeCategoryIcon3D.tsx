import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { categoryTypeEmoji } from "@/lib/icons/platform-emoji-v1";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import { cn } from "@/lib/cn";

type HomeCategoryIcon3DProps = {
  type: HomeCategoryIconType;
  className?: string;
  size?: number;
};

/** Functional category tile glyph — platform emoji. Photographic Search heroes unchanged. */
export function HomeCategoryIcon3D({ type, className, size = 40 }: HomeCategoryIcon3DProps) {
  return (
    <span
      className={cn("inline-flex items-center justify-center text-current", className)}
      data-home-category-icon="emoji"
      style={{ width: size, height: size }}
    >
      <PlatformEmoji emoji={categoryTypeEmoji(type)} width={size} height={size} />
    </span>
  );
}
