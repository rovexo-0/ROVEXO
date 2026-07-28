/**
 * ROVEXO v1.0 — HOMEPAGE SEARCH BAR ONLY
 * OWNER APPROVED · PERMANENT FREEZE · 2026-07-23
 *
 * SEARCH BAR mounts ONLY on Homepage (`/`).
 * Everywhere else the marketplace header (ROVEXO + Search) is UNMOUNTED —
 * never CSS-hidden, opacity 0, or display:none.
 */

export const HOMEPAGE_SEARCH_BAR_ONLY_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_PERMANENT_FREEZE",
  approvedByOwner: true,
  freezeLocked: true,
  permanent: true,
  approvedAt: "2026-07-23",

  allowedRoutes: ["/"] as const,

  forbiddenSurfaces: [
    "Inbox",
    "Notifications",
    "Conversation",
    "Account",
    "Settings",
    "Wallet",
    "Orders",
    "Sell",
    "Checkout",
    "Saved",
    "Reviews",
    "Addresses",
    "Payment methods",
    "Legal pages",
    "Help Center",
    "Verification",
    "Business pages",
    "Admin pages",
    "Search results",
    "Categories",
    "every other page",
  ] as const,

  hideTricksForbidden: [
    "hidden",
    "display:none",
    "opacity:0",
    "visibility:hidden",
    "responsive hidden",
  ] as const,

  mustBe: "UNMOUNTED" as const,

  headerLaw: {
    homepage: ["ROVEXO", "Search Bar"],
    inbox: ["Back", "Inbox"],
    notifications: ["Back", "Inbox"],
    conversation: ["Back", "Username", "Info", "Active now"],
    profile: ["Back", "Profile"],
    settings: ["Back", "Settings"],
    wallet: ["Back", "Wallet"],
    orders: ["Back", "Orders"],
    sell: ["Back", "Sell"],
  } as const,

  entryPointOnly: "features/header/HeaderProvider.tsx",

  ssot: {
    code: "lib/header/homepage-search-bar-only-v1.ts",
    rule: ".cursor/rules/homepage-search-bar-only-v1.mdc",
    header: "features/header/HeaderProvider.tsx",
  } as const,

  parentLaws: {
    bloodIx: "lib/supreme-blood-code-ix-v1.ts",
    searchPriority: "lib/header/search-priority-freeze-v1.ts",
    headerMaster: "lib/header/header-master-freeze-v1.ts",
  } as const,
} as const;

export type HomepageSearchBarOnlyV1 = typeof HOMEPAGE_SEARCH_BAR_ONLY_V1;

/** True only when marketplace ROVEXO + Search header may mount. */
export function isHomepageSearchBarRoute(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return (HOMEPAGE_SEARCH_BAR_ONLY_V1.allowedRoutes as readonly string[]).includes(path);
}
