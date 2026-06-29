import type { ComponentType, SVGProps } from "react";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import type { Fluency3DIconKey } from "@/lib/icons/fluency-3d-registry";

type FeatureIconProps = {
  className?: string;
  size?: number;
};

function resolvePixelSize(
  props: SVGProps<SVGSVGElement> & { size?: number },
  defaultSize: number,
): number {
  if (typeof props.size === "number") return props.size;
  if (typeof props.width === "number") return props.width;
  if (typeof props.height === "number") return props.height;
  return defaultSize;
}

export function createFluencyFeatureIcon(
  key: Fluency3DIconKey,
  defaultSize = 24,
): ComponentType<SVGProps<SVGSVGElement> & { size?: number }> {
  return function FluencyFeatureIcon(props) {
    const { className } = props;
    const size = resolvePixelSize(props, defaultSize);
    return <Fluency3DIcon icon={key} size={size} className={className} />;
  };
}

export function createFluencyClassIcon(
  key: Fluency3DIconKey,
  defaultSize = 24,
): ComponentType<FeatureIconProps> {
  return function FluencyClassIcon({ className, size = defaultSize }) {
    return <Fluency3DIcon icon={key} size={size} className={className} />;
  };
}
