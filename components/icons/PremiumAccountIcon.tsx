import {
  getAccountIconPng,
  getAccountIconSrcSet,
  getAccountIconWebp,
  type AccountPremiumIconKey,
} from "@/lib/account-center/premium-icons";
import { cn } from "@/lib/cn";

type PremiumAccountIconProps = {
  icon: AccountPremiumIconKey;
  /** Rendered square size in px. */
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Realistic 3D account-family icon. Transparent WebP with PNG fallback — no plate,
 * no border, one shared lighting/perspective family with the nav + category icons.
 * Purely decorative; the surrounding link/card provides the accessible label.
 */
export function PremiumAccountIcon({ icon, size = 40, className, priority = false }: PremiumAccountIconProps) {
  const sizes = `${size}px`;
  return (
    <picture>
      <source type="image/webp" srcSet={getAccountIconSrcSet(icon, "webp")} sizes={sizes} />
      <img
        src={getAccountIconPng(icon)}
        srcSet={getAccountIconSrcSet(icon, "png")}
        sizes={sizes}
        alt=""
        aria-hidden
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={cn("rovexo-account-icon shrink-0 object-contain", className)}
        style={{ width: size, height: size }}
      />
    </picture>
  );
}

/** Explicit named exports kept in sync with the icon library for tree-shaking clarity. */
export type { AccountPremiumIconKey };
export { getAccountIconWebp };
