import type {
  MigrationConnectorInput,
  MigrationProvider,
} from "@/lib/seller/migration/engine/types";
import type { MigrationImportMethodId } from "@/lib/seller/migration/types";
import { createStubProvider } from "@/lib/seller/migration/providers/stub-provider";
import type { MigrationProviderCapabilities } from "@/lib/seller/migration/engine/types";
import type { ConnectorCapabilityFlags } from "@/lib/seller/migration/connectors/types";

export function toMigrationProviderCapabilities(
  definition: {
    id: MigrationProviderCapabilities["id"];
    name: string;
    supportedMethods: readonly MigrationImportMethodId[];
    integrationStatus: MigrationProviderCapabilities["integrationStatus"];
    capabilities: ConnectorCapabilityFlags;
  },
): MigrationProviderCapabilities & { capabilities: ConnectorCapabilityFlags } {
  return {
    id: definition.id,
    name: definition.name,
    supportedMethods: [...definition.supportedMethods],
    integrationStatus: definition.integrationStatus,
    capabilities: definition.capabilities,
  };
}

export function createMigrationProviderAdapter(
  definition: {
    id: MigrationProviderCapabilities["id"];
    name: string;
    supportedMethods: readonly MigrationImportMethodId[];
    integrationStatus: MigrationProviderCapabilities["integrationStatus"];
    capabilities: ConnectorCapabilityFlags;
  },
  handlers: {
    connect: MigrationProvider["connect"];
    fetchListings: MigrationProvider["fetchListings"];
    estimateTotal: MigrationProvider["estimateTotal"];
  },
): MigrationProvider {
  return {
    capabilities: toMigrationProviderCapabilities(definition),
    connect: handlers.connect,
    fetchListings: handlers.fetchListings,
    estimateTotal: handlers.estimateTotal,
  };
}

export function createStubMigrationHandlers(
  definition: {
    id: MigrationProviderCapabilities["id"];
    name: string;
    supportedMethods: readonly MigrationImportMethodId[];
  },
): Pick<MigrationProvider, "connect" | "fetchListings" | "estimateTotal"> {
  const stub = createStubProvider(definition.id, definition.name, [...definition.supportedMethods]);
  return {
    connect: stub.connect.bind(stub),
    fetchListings: stub.fetchListings.bind(stub),
    estimateTotal: stub.estimateTotal.bind(stub),
  };
}

export function migrationInputFromConnector(
  input: MigrationConnectorInput,
): MigrationConnectorInput {
  return input;
}
