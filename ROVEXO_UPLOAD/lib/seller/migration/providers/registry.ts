import "server-only";

import {
  getConnectorAsMigrationProvider,
  listConnectorMigrationProviders,
} from "@/lib/seller/migration/connectors/registry";
import { CONNECTOR_PLATFORM_IDS } from "@/lib/seller/migration/connectors/definitions";
import type { MigrationProvider } from "@/lib/seller/migration/engine/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export function getMigrationProvider(platform: MigrationPlatformId): MigrationProvider {
  return getConnectorAsMigrationProvider(platform);
}

export function listMigrationProviders(): MigrationProvider[] {
  return listConnectorMigrationProviders();
}

export const MIGRATION_PLATFORM_IDS = CONNECTOR_PLATFORM_IDS;
