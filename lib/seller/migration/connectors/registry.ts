import "server-only";

import { createConnector } from "@/lib/seller/migration/connectors/factory";
import { listConnectorDefinitions } from "@/lib/seller/migration/connectors/definitions";
import type { UniversalConnector } from "@/lib/seller/migration/connectors/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import type { MigrationProvider } from "@/lib/seller/migration/engine/types";

const connectorCache = new Map<MigrationPlatformId, UniversalConnector>();

export function getUniversalConnector(platform: MigrationPlatformId): UniversalConnector {
  const cached = connectorCache.get(platform);
  if (cached) return cached;

  const connector = createConnector(platform);
  connectorCache.set(platform, connector);
  return connector;
}

export function listUniversalConnectors(): UniversalConnector[] {
  return listConnectorDefinitions().map((definition) => getUniversalConnector(definition.id));
}

export function getConnectorAsMigrationProvider(platform: MigrationPlatformId): MigrationProvider {
  return getUniversalConnector(platform).asMigrationProvider();
}

export function listConnectorMigrationProviders(): MigrationProvider[] {
  return listUniversalConnectors().map((connector) => connector.asMigrationProvider());
}
