import { MIGRATION_PLATFORMS } from "@/lib/seller/migration/constants";
import { listConnectorDefinitions } from "@/lib/seller/migration/connectors/definitions";
import {
  listSupportedFeatures,
  resolveAuthenticationType,
  toMarketplaceCapabilities,
} from "@/lib/seller/marketplace/capabilities";
import { MARKETPLACE_PROVIDER_VERSION } from "@/lib/seller/marketplace/config";
import type { MarketplaceProviderRegistryEntry } from "@/lib/seller/marketplace/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

const platformMeta = new Map(MIGRATION_PLATFORMS.map((platform) => [platform.id, platform]));

function describeProvider(name: string, integrationStatus: string): string {
  if (integrationStatus === "file") {
    return `Import listings into ROVEXO from ${name} files.`;
  }
  if (integrationStatus === "api") {
    return `Connect ${name} using official API credentials for secure import and sync.`;
  }
  return `Prepare ${name} listings for migration. Official connector integration coming soon.`;
}

export function buildRegistryEntry(definition: {
  id: MigrationPlatformId;
  name: string;
  integrationStatus: "ready" | "stub" | "api" | "file";
  supportedMethods: readonly import("@/lib/seller/migration/types").MigrationImportMethodId[];
  capabilities: import("@/lib/seller/migration/connectors/types").ConnectorCapabilityFlags;
}): MarketplaceProviderRegistryEntry {
  const meta = platformMeta.get(definition.id);
  const capabilities = toMarketplaceCapabilities(definition.capabilities, definition.supportedMethods);

  return {
    id: definition.id,
    name: definition.name,
    logo: meta?.icon ?? "🔗",
    description: describeProvider(definition.name, definition.integrationStatus),
    version: MARKETPLACE_PROVIDER_VERSION,
    status: "available",
    capabilities,
    authenticationType: resolveAuthenticationType(
      definition.integrationStatus,
      definition.supportedMethods,
      definition.capabilities,
    ),
    importMethods: [...definition.supportedMethods],
    supportedFeatures: listSupportedFeatures(capabilities),
    integrationStatus: definition.integrationStatus,
  };
}

const registry = listConnectorDefinitions().map((definition) => buildRegistryEntry(definition));

const registryMap = new Map(registry.map((entry) => [entry.id, entry]));

export function listMarketplaceRegistry(): MarketplaceProviderRegistryEntry[] {
  return registry;
}

export function getMarketplaceRegistryEntry(
  platform: MigrationPlatformId,
): MarketplaceProviderRegistryEntry {
  return registryMap.get(platform) ?? registryMap.get("other")!;
}
