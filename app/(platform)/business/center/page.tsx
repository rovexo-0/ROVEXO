import { redirect } from "next/navigation";
import { BUSINESS_DASHBOARD_ROUTE } from "@/lib/navigation/routes";

/**
 * Legacy alias. `/business/center` is no longer a distinct Business surface —
 * the canonical route is `/business/dashboard` (Single Source of Truth). Kept as
 * a permanent redirect so existing links/bookmarks continue to resolve.
 */
export default function BusinessCenterLegacyRedirect() {
  redirect(BUSINESS_DASHBOARD_ROUTE);
}
