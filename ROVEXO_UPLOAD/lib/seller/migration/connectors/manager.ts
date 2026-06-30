import "server-only";

import { listConnectorDefinitions } from "@/lib/seller/migration/connectors/definitions";
import { getUniversalConnector } from "@/lib/seller/migration/connectors/registry";
import type { ConnectorRuntimeStatus } from "@/lib/seller/migration/connectors/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export type ConnectorManagerSummary = {
  connectors: ConnectorRuntimeStatus[];
  totalProviders: number;
  connectedCount: number;
};

export async function getConnectorManagerSummary(
  sellerId: string,
): Promise<ConnectorManagerSummary> {
  const definitions = listConnectorDefinitions();
  const connectors = await Promise.all(
    definitions.map((definition) => getUniversalConnector(definition.id).getStatus(sellerId)),
  );

  return {
    connectors,
    totalProviders: connectors.length,
    connectedCount: connectors.filter((connector) => connector.connectionStatus === "connected")
      .length,
  };
}

export async function getConnectorStatus(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<ConnectorRuntimeStatus> {
  return getUniversalConnector(platform).getStatus(sellerId);
}
