import "server-only";

import { logMarketplaceEvent } from "@/lib/seller/marketplace/logger";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export class MarketplaceConnectorError extends Error {
  readonly platform: MigrationPlatformId;
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    platform: MigrationPlatformId,
    code: string,
    message: string,
    retryable = false,
  ) {
    super(message);
    this.platform = platform;
    this.code = code;
    this.retryable = retryable;
  }
}

export function handleMarketplaceError(
  platform: MigrationPlatformId,
  error: unknown,
): MarketplaceConnectorError {
  if (error instanceof MarketplaceConnectorError) return error;

  const message = error instanceof Error ? error.message : "Unknown marketplace connector error.";
  const retryable = /timeout|rate|429|503|network/i.test(message);
  const code = retryable ? "retryable" : "connector_failed";

  logMarketplaceEvent("error", message, { platform, code });
  return new MarketplaceConnectorError(platform, code, message, retryable);
}
