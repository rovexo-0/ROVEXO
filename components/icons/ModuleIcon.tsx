"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { resolveModuleIcon } from "@/lib/icons/module-icon";
import { cn } from "@/lib/cn";

type ModuleIconProps = {
  href?: string;
  id?: string;
  className?: string;
  size?: number;
};

/** Official icon for engine hubs, admin modules, and integration tiles. */
export function ModuleIcon({ href, id, className, size = 24 }: ModuleIconProps) {
  const icon = resolveModuleIcon({ href, id });
  return <RovexoIcon icon={icon} size={size} className={cn("shrink-0", className)} />;
}
