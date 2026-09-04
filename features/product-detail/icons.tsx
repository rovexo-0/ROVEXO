import type { HTMLAttributes } from "react";
import {
  BackLineIcon,
  ChevronRightLineIcon,
  HeartLineIcon,
  ShieldLineIcon,
} from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type FeatureIconProps = HTMLAttributes<HTMLSpanElement> & {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
};

function resolvePixelSize(props: FeatureIconProps, defaultSize: number): number {
  if (typeof props.size === "number") return props.size;
  if (typeof props.width === "number") return props.width;
  if (typeof props.height === "number") return props.height;
  return defaultSize;
}

export function BackIcon(props: FeatureIconProps) {
  const size = resolvePixelSize(props, 24);
  return <BackLineIcon className={props.className} width={size} height={size} />;
}

export function ShareIcon({ className, ...props }: FeatureIconProps) {
  const size = resolvePixelSize(props, 24);
  return <PlatformEmoji emoji={PLATFORM_EMOJI.share} className={className} width={size} height={size} />;
}

export function ShieldIcon(props: FeatureIconProps) {
  const size = resolvePixelSize(props, 24);
  return <ShieldLineIcon className={props.className} width={size} height={size} />;
}

export function ChevronRightIcon(props: FeatureIconProps) {
  const size = resolvePixelSize(props, 24);
  return <ChevronRightLineIcon className={props.className} width={size} height={size} />;
}

export const VerifiedIcon = ShieldIcon;

export function HeartIcon({
  filled,
  className,
  ...props
}: FeatureIconProps & { filled?: boolean }) {
  const size = resolvePixelSize(props, 24);
  return (
    <HeartLineIcon
      className={className}
      width={size}
      height={size}
      data-filled={filled ? "true" : undefined}
    />
  );
}
