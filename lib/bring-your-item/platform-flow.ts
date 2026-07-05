import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";

export type BringYourItemConnectMode = "oauth" | "inline_url" | "inline_file" | "coming_soon";

export type BringYourItemPlatformFlow = {
  id: MigrationPlatformId;
  name: string;
  icon: string;
  defaultMethod: MigrationImportMethodId;
  connectMode: BringYourItemConnectMode;
  requiresConnection: boolean;
};

/** Curated Bring Your Item platforms — Single Source of Truth for wizard UX. */
export const BRING_YOUR_ITEM_PLATFORM_FLOWS: readonly BringYourItemPlatformFlow[] = [
  {
    id: "ebay",
    name: "eBay",
    icon: "🛒",
    defaultMethod: "api_import",
    connectMode: "oauth",
    requiresConnection: true,
  },
  {
    id: "etsy",
    name: "Etsy",
    icon: "🧵",
    defaultMethod: "api_import",
    connectMode: "oauth",
    requiresConnection: true,
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: "🛍️",
    defaultMethod: "api_import",
    connectMode: "oauth",
    requiresConnection: true,
  },
  {
    id: "facebook_marketplace",
    name: "Facebook Marketplace",
    icon: "📘",
    defaultMethod: "single_url",
    connectMode: "inline_url",
    requiresConnection: false,
  },
  {
    id: "amazon",
    name: "Amazon",
    icon: "📦",
    defaultMethod: "store_import",
    connectMode: "coming_soon",
    requiresConnection: false,
  },
  {
    id: "vinted",
    name: "Vinted",
    icon: "👗",
    defaultMethod: "single_url",
    connectMode: "coming_soon",
    requiresConnection: false,
  },
  {
    id: "depop",
    name: "Depop",
    icon: "👜",
    defaultMethod: "single_url",
    connectMode: "coming_soon",
    requiresConnection: false,
  },
  {
    id: "csv",
    name: "CSV file",
    icon: "📄",
    defaultMethod: "csv",
    connectMode: "inline_file",
    requiresConnection: false,
  },
] as const;

export function resolvePlatformFlow(platform: MigrationPlatformId): BringYourItemPlatformFlow | null {
  return BRING_YOUR_ITEM_PLATFORM_FLOWS.find((entry) => entry.id === platform) ?? null;
}

export function resolveDefaultImportMethod(platform: MigrationPlatformId): MigrationImportMethodId {
  return resolvePlatformFlow(platform)?.defaultMethod ?? "single_url";
}

export function isPlatformImportReady(
  platform: MigrationPlatformId,
  options: { connected: boolean; hasSourceInput: boolean },
): boolean {
  const flow = resolvePlatformFlow(platform);
  if (!flow || flow.connectMode === "coming_soon") return false;
  if (flow.requiresConnection && !options.connected) return false;
  if (flow.connectMode === "inline_url" || flow.connectMode === "inline_file") {
    return options.hasSourceInput;
  }
  if (flow.connectMode === "oauth") {
    return options.connected;
  }
  return true;
}
