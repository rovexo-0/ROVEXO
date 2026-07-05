import "server-only";

import type {
  MigrationConnectorInput,
  MigrationNormalizedListing,
  MigrationProcessedImage,
  MigrationProvider,
  MigrationRawListing,
} from "@/lib/seller/migration/engine/types";
import {
  createMigrationProviderAdapter,
  createStubMigrationHandlers,
} from "@/lib/seller/migration/connectors/adapter";
import {
  disconnectConnector,
  getConnectorRecord,
  loadConnectorCredentials,
  saveConnectorConnection,
  touchConnectorSync,
  type StoredConnectorCredentials,
} from "@/lib/seller/migration/connectors/credentials";
import type { ConnectorDefinition, ConnectorConnectInput, ConnectorRuntimeStatus, ConnectorValidationResult, UniversalConnector } from "@/lib/seller/migration/connectors/types";
import {
  categoryPipeline,
  imagePipeline,
  reportPipeline,
  validationPipeline,
} from "@/lib/seller/migration/connectors/pipelines";
import { normalizeListing } from "@/lib/seller/migration/engine/normalizer";
import { isImportCancelled, markImportCancelled } from "@/lib/seller/migration/connectors/import-state";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export type ConnectorHandlers = {
  connect?: (input: ConnectorConnectInput) => Promise<void>;
  fetchListings: (input: MigrationConnectorInput) => Promise<MigrationRawListing[]>;
  estimateTotal: (input: Omit<MigrationConnectorInput, "offset" | "limit">) => Promise<number>;
  validateConfiguration?: (
    input: ConnectorConnectInput,
  ) => ConnectorValidationResult | Promise<ConnectorValidationResult>;
};

export class BaseUniversalConnector implements UniversalConnector {
  readonly definition: ConnectorDefinition;

  private readonly handlers: ConnectorHandlers;

  constructor(definition: ConnectorDefinition, handlers: ConnectorHandlers) {
    this.definition = definition;
    this.handlers = handlers;
  }

  private toStoredCredentials(input: ConnectorConnectInput): StoredConnectorCredentials {
    return {
      storeUrl: input.storeUrl,
      apiKey: input.apiKey,
      apiSecret: input.apiSecret,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      fileName: input.fileName,
      expiresAt: input.expiresAt,
      scopes: input.scopes,
      connectedAt: input.connectedAt ?? new Date().toISOString(),
    };
  }

  async connect(input: ConnectorConnectInput): Promise<void> {
    const validation = await this.validateConfiguration(input);
    if (!validation.valid) {
      await saveConnectorConnection(
        input,
        this.toStoredCredentials(input),
        "error",
        validation.errors[0]?.message ?? "Invalid configuration.",
      );
      throw new Error(validation.errors[0]?.message ?? "Invalid connector configuration.");
    }

    if (this.handlers.connect) {
      await this.handlers.connect(input);
    }

    await saveConnectorConnection(input, this.toStoredCredentials(input), "connected");
  }

  async disconnect(sellerId: string): Promise<void> {
    await disconnectConnector(sellerId, this.definition.id);
  }

  async validateConfiguration(input: ConnectorConnectInput): Promise<ConnectorValidationResult> {
    if (this.handlers.validateConfiguration) {
      return this.handlers.validateConfiguration(input);
    }

    const errors: ConnectorValidationResult["errors"] = [];
    const caps = this.definition.capabilities;

    if (caps.authentication && !input.accessToken && !input.apiKey && !input.storeUrl) {
      errors.push({
        field: "credentials",
        message: "API credentials or store URL required for this connector.",
      });
    }

    if (caps.fileImport && input.fileName && input.fileName.length > 200) {
      errors.push({ field: "fileName", message: "File name is too long." });
    }

    return { valid: errors.length === 0, errors };
  }

  async estimateTotal(input: Omit<MigrationConnectorInput, "offset" | "limit">): Promise<number> {
    return this.handlers.estimateTotal(input);
  }

  async fetchListings(input: MigrationConnectorInput): Promise<MigrationRawListing[]> {
    if (isImportCancelled(input.jobId)) return [];
    const listings = await this.handlers.fetchListings(input);
    await touchConnectorSync(input.sellerId, input.platform);
    return listings;
  }

  async cancelImport(jobId: string, sellerId: string): Promise<void> {
    void sellerId;
    markImportCancelled(jobId);
  }

  validateListing(raw: MigrationRawListing): ConnectorValidationResult {
    return validationPipeline.validateRaw(raw);
  }

  normalizeListing(raw: MigrationRawListing): MigrationNormalizedListing {
    return normalizeListing(raw);
  }

  async downloadImages(listing: MigrationRawListing): Promise<MigrationProcessedImage[]> {
    return imagePipeline.process(listing);
  }

  async mapCategories(
    listing: MigrationNormalizedListing,
    sellerId: string,
    platform: MigrationPlatformId,
  ): Promise<MigrationNormalizedListing> {
    return categoryPipeline.map(listing, sellerId, platform);
  }

  async generateReport(jobId: string, sellerId: string): Promise<Record<string, unknown>> {
    const report = await reportPipeline.buildJson(sellerId, jobId);
    return (report as Record<string, unknown>) ?? {};
  }

  async getStatus(sellerId: string): Promise<ConnectorRuntimeStatus> {
    const record = await getConnectorRecord(sellerId, this.definition.id);
    return {
      platform: this.definition.id,
      name: this.definition.name,
      connectionStatus: record?.connectionStatus ?? "disconnected",
      integrationStatus: this.definition.integrationStatus,
      capabilities: this.definition.capabilities,
      supportedMethods: [...this.definition.supportedMethods],
      lastSyncAt: record?.lastSyncAt ?? null,
      lastError: record?.lastError ?? null,
    };
  }

  asMigrationProvider(): MigrationProvider {
    const stubFallback = createStubMigrationHandlers(this.definition);
    return createMigrationProviderAdapter(this.definition, {
      connect: stubFallback.connect,
      fetchListings: async (input) => this.fetchListings(input),
      estimateTotal: (input) => this.estimateTotal(input),
    });
  }
}

export async function hasLiveApiCredentials(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<boolean> {
  const credentials = await loadConnectorCredentials(sellerId, platform);
  if (platform === "etsy") {
    return Boolean(
      credentials?.accessToken &&
        (credentials.apiKey || process.env.ETSY_API_KEYSTRING?.trim()),
    );
  }
  if (platform === "ebay") {
    return Boolean(credentials?.accessToken);
  }
  return Boolean(credentials?.accessToken || credentials?.apiKey);
}
