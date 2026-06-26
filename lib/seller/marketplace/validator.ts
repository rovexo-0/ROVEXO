import "server-only";

import type { ConnectorConnectInput, ConnectorValidationResult } from "@/lib/seller/migration/connectors/types";
import type { MigrationRawListing } from "@/lib/seller/migration/engine/types";
import { validationPipeline } from "@/lib/seller/migration/connectors/pipelines";
import { getMarketplaceProvider } from "@/lib/seller/marketplace/factory";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export function validateMarketplaceConfiguration(
  platform: MigrationPlatformId,
  input: ConnectorConnectInput,
): Promise<ConnectorValidationResult> {
  return getMarketplaceProvider(platform).validate(input);
}

export function validateMarketplaceListing(
  platform: MigrationPlatformId,
  raw: MigrationRawListing,
): ConnectorValidationResult {
  void platform;
  return validationPipeline.validateRaw(raw);
}
