import { createFluencyFeatureIcon } from "@/components/icons/fluency-3d-feature";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import type { SVGProps } from "react";

export const BackIcon = createFluencyFeatureIcon("feature-back");
export const ShareIcon = createFluencyFeatureIcon("feature-share");
export const ShieldIcon = createFluencyFeatureIcon("feature-shield");
export const ChevronRightIcon = createFluencyFeatureIcon("feature-chevron-right");
export const VerifiedIcon = createFluencyFeatureIcon("feature-verified");

export function HeartIcon({
  filled,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const size =
    typeof props.width === "number" ? props.width : typeof props.height === "number" ? props.height : 24;

  return (
    <Fluency3DIcon
      icon={filled ? "feature-heart-filled" : "feature-heart"}
      size={size}
      className={className}
    />
  );
}
