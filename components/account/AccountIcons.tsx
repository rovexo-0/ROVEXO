/**
 * ROVEXO v1.0 — Account / Hub icons (global emoji system).
 * Same semantic keys as before; glyphs are platform emoji, not SVG.
 */

import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import {
  ACCOUNT_ICON_EMOJI,
  type AccountIconName,
} from "@/lib/icons/platform-emoji-v1";

export type { AccountIconName };

export function AccountIcon({ name, className }: { name: AccountIconName; className?: string }) {
  return <PlatformEmoji emoji={ACCOUNT_ICON_EMOJI[name]} className={className} />;
}
