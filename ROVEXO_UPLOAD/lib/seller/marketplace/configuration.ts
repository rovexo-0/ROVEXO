import "server-only";

import {
  getMarketplaceConnectorRecord,
  updateMarketplaceConnectorRecord,
} from "@/lib/seller/marketplace/repository";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import { getConnectorDefinition } from "@/lib/seller/migration/connectors/definitions";

export async function setMarketplaceProviderEnabled(
  sellerId: string,
  platform: MigrationPlatformId,
  enabled: boolean,
): Promise<void> {
  await updateMarketplaceConnectorRecord(sellerId, platform, { enabled });
}

export async function resetMarketplaceProviderSettings(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<void> {
  await updateMarketplaceConnectorRecord(sellerId, platform, {
    settings: {},
    lastError: null,
    syncStatus: "disconnected",
    healthStatus: "offline",
  });
}

export async function getMarketplaceProviderSettings(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<Record<string, unknown>> {
  const record = await getMarketplaceConnectorRecord(sellerId, platform);
  return record?.settings ?? {};
}

export async function updateMarketplaceProviderSettings(
  sellerId: string,
  platform: MigrationPlatformId,
  settings: Record<string, unknown>,
): Promise<void> {
  const current = await getMarketplaceProviderSettings(sellerId, platform);
  await updateMarketplaceConnectorRecord(sellerId, platform, {
    settings: { ...current, ...settings },
  });
}

export function isProviderAvailable(platform: MigrationPlatformId): boolean {
  const definition = getConnectorDefinition(platform);
  return definition.integrationStatus !== "stub" || definition.capabilities.bulkImport;
}
