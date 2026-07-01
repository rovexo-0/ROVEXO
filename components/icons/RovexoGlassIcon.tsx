"use client";

import { RovexoIcon, type RovexoIconProps } from "@/components/icons/RovexoIcon";

export type RovexoGlassIconProps = RovexoIconProps;

/** @deprecated Use `RovexoIcon` */
export function RovexoGlassIcon(props: RovexoGlassIconProps) {
  return <RovexoIcon {...props} />;
}

/** @deprecated Use `RovexoIcon` */
export const RovexoGlassIconSystem = RovexoIcon;
