/**
 * Admin Command Centre sidebar modules (role-limited).
 * Super Admin uses COMMAND_CENTER_SIDEBAR_NAV — do not merge lists.
 */

import type { SuperAdminNavItem } from "@/lib/super-admin/nav-types";
import { ADMIN_NAV } from "@/lib/navigation/map";

/**
 * Super Admin–only destinations that still exist under `/admin/*` as legacy
 * redirects. Never show these in the Admin Command Centre sidebar.
 */
const ADMIN_NAV_SUPER_ADMIN_ONLY = new Set(["/admin/categories"]);

/** Map platform Admin console routes into the shared Command Centre nav shape. */
export const ADMIN_COMMAND_CENTRE_NAV: SuperAdminNavItem[] = ADMIN_NAV.filter(
  (item) => !ADMIN_NAV_SUPER_ADMIN_ONLY.has(item.href),
).map((item) => ({
  href: item.href,
  label: item.label.replace(/^Admin\s+/i, "").replace(/\s+Admin$/i, "") || item.label,
  description: item.subtitle,
  icon:
    item.href === "/admin"
      ? "layout-dashboard"
      : item.href.includes("operations")
        ? "settings"
        : item.href.includes("analytics")
          ? "bar-chart-3"
          : item.href.includes("help")
            ? "mail"
            : item.href.includes("trust")
              ? "shield"
              : item.href.includes("business")
                ? "hexagon"
                : item.href.includes("wholesale")
                  ? "package"
                  : item.href.includes("monetization")
                    ? "credit-card"
                    : item.href.includes("orders")
                      ? "package"
                      : item.href.includes("promotions")
                        ? "tag"
                        : item.href.includes("moderation")
                          ? "tag"
                          : item.href.includes("seo")
                            ? "bar-chart-3"
                            : item.href.includes("protection")
                              ? "scale"
                              : "settings",
}));
