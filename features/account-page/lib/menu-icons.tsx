import { resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import { resolveDashboardGlassIcon } from "@/lib/icons/resolve";
import type { RovexoIconRef } from "@/lib/icons/types";

export function resolveMenuIcon(href: string): RovexoIconRef {
  return resolveDashboardGlassIcon(resolveDashboardIconType(href));
}
