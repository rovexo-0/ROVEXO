import type { ComponentType, SVGProps } from "react";
import {
  BackLineIcon,
  ChevronRightLineIcon,
  HeartLineIcon,
  ShieldLineIcon,
} from "@/components/icons/RvxLineIcons";

type FeatureIconProps = SVGProps<SVGSVGElement> & { size?: number };

function resolvePixelSize(props: FeatureIconProps, defaultSize: number): number {
  if (typeof props.size === "number") return props.size;
  if (typeof props.width === "number") return props.width;
  if (typeof props.height === "number") return props.height;
  return defaultSize;
}

function createLineFeatureIcon(
  Icon: ComponentType<SVGProps<SVGSVGElement>>,
  defaultSize = 24,
): ComponentType<FeatureIconProps> {
  return function LineFeatureIcon(props) {
    const { className, size, ...rest } = props;
    const resolved = resolvePixelSize(props, defaultSize);
    return <Icon className={className} width={resolved} height={resolved} {...rest} />;
  };
}

export const BackIcon = createLineFeatureIcon(BackLineIcon);

export function ShareIcon({ className, ...props }: FeatureIconProps) {
  const size = resolvePixelSize(props, 24);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V4" />
      <path d="m8 8 4-4 4 4" />
    </svg>
  );
}

export const ShieldIcon = createLineFeatureIcon(ShieldLineIcon);
export const ChevronRightIcon = createLineFeatureIcon(ChevronRightLineIcon);
export const VerifiedIcon = createLineFeatureIcon(ShieldLineIcon);

export function HeartIcon({
  filled,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const size = resolvePixelSize(props, 24);
  return (
    <HeartLineIcon
      className={className}
      width={size}
      height={size}
      style={filled ? { fill: "currentColor" } : undefined}
      aria-hidden
    />
  );
}
