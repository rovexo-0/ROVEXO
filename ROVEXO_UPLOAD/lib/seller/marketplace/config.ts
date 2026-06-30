import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";

export const MARKETPLACE_CONNECTORS_PATH = "/seller/connectors" as const;

export const MARKETPLACE_PROVIDER_VERSION = "1.0.0";

export function isMarketplaceConnectorsEnabled(): boolean {
  return isStoreMigrationEnabled();
}
