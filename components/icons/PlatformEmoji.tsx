import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type PlatformEmojiProps = {
  emoji: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  size?: number;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className" | "style">;

/**
 * Ordinary functional icon renderer — emoji as normal text, sized to the icon box.
 */
export function PlatformEmoji({
  emoji,
  className,
  width,
  height,
  size,
  style,
  ...rest
}: PlatformEmojiProps) {
  const px =
    typeof size === "number"
      ? size
      : typeof width === "number"
        ? width
        : typeof height === "number"
          ? height
          : undefined;

  return (
    <span
      className={cn("rx-platform-emoji", className)}
      style={{
        ...(px != null
          ? { width: px, height: px, fontSize: Math.max(12, Math.round(px * 0.82)) }
          : {}),
        ...style,
      }}
      aria-hidden
      {...rest}
    >
      {emoji}
    </span>
  );
}
