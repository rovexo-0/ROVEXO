export type {
  ConnectorCapabilityFlags,
  ConnectorConnectInput,
  ConnectorConnectionStatus,
  ConnectorDefinition,
  ConnectorIntegrationStatus,
  ConnectorRuntimeStatus,
  ConnectorValidationResult,
  UniversalConnector,
} from "@/lib/seller/migration/connectors/types";

export {
  EMPTY_CAPABILITIES,
  apiMarketplaceCapabilities,
  classifiedsCapabilities,
  ecommerceCapabilities,
  fileCapabilities,
  mergeCapabilities,
} from "@/lib/seller/migration/connectors/capabilities";

export {
  CONNECTOR_DEFINITIONS,
  CONNECTOR_PLATFORM_IDS,
  getConnectorDefinition,
  listConnectorDefinitions,
} from "@/lib/seller/migration/connectors/definitions";
