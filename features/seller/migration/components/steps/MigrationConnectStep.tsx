"use client";

import { Button } from "@/components/ui/Button";
import { MigrationSourceFields, type MigrationSourceInput } from "@/features/seller/migration/components/MigrationSourceFields";
import { MigrationInlinePreviewPanel } from "@/features/seller/migration/components/inline/MigrationInlinePreviewPanel";
import type { InlineImportPreview } from "@/lib/bring-your-item/inline-import-engine";
import type { BringYourItemPlatformFlow } from "@/lib/bring-your-item/platform-flow";
import type { MarketplaceHealthStatus } from "@/lib/seller/marketplace/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

type MigrationConnectStepProps = {
  platformId: MigrationPlatformId | null;
  platformLabel: string;
  platformFlow: BringYourItemPlatformFlow | null;
  importMethod: MigrationImportMethodId | null;
  source: MigrationSourceInput;
  onChangeSource: (patch: Partial<MigrationSourceInput>) => void;
  isConnected: boolean;
  isConnecting: boolean;
  onConnectOAuth: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  connectionHealth?: MarketplaceHealthStatus | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  isActionPending?: boolean;
  inlinePreview: InlineImportPreview | null;
  isPreviewing: boolean;
  previewError: string | null;
};

function formatRelativeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function healthLabel(status: MarketplaceHealthStatus | null | undefined): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Needs attention";
    case "authentication_expired":
      return "Reconnect required";
    case "rate_limited":
      return "Rate limited";
    case "maintenance":
      return "Maintenance";
    case "offline":
    default:
      return "Offline";
  }
}

export function MigrationConnectStep({
  platformId,
  platformLabel,
  platformFlow,
  importMethod,
  source,
  onChangeSource,
  isConnected,
  isConnecting,
  onConnectOAuth,
  onDisconnect,
  onReconnect,
  connectionHealth,
  lastSyncAt,
  lastError,
  isActionPending = false,
  inlinePreview,
  isPreviewing,
  previewError,
}: MigrationConnectStepProps) {
  if (!platformFlow || !importMethod) return null;

  const shopRequired = platformId === "shopify" && !isConnected;
  const shopValue = source.storeUrl.trim();
  const canConnectOAuth = !shopRequired || shopValue.length > 0;
  const lastSync = formatRelativeTime(lastSyncAt);

  return (
    <div className="flex w-full flex-col gap-ds-4">
      <CanonicalSection title="Connect & import">
        <CanonicalCard variant="list">
          {platformFlow.connectMode === "oauth" ? (
            isConnected ? (
              <>
                <CanonicalMenuRow
                  title={`Connected to ${platformLabel}`}
                  description={
                    [
                      connectionHealth ? healthLabel(connectionHealth) : "Connection active",
                      lastSync ? `Last sync ${lastSync}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  }
                  showChevron={false}
                />
                {lastError ? (
                  <CanonicalMenuRow title="Notice" description={lastError} showChevron={false} />
                ) : null}
                <CanonicalMenuRow
                  title="Import"
                  description="Fetch listings and start batch import"
                  showChevron={false}
                />
              </>
            ) : (
              <CanonicalMenuRow
                title={`Connect with ${platformLabel}`}
                description="Authenticate, then return here to import"
                showChevron={false}
              />
            )
          ) : null}

          {platformFlow.connectMode === "coming_soon" ? (
            <CanonicalMenuRow
              title={platformLabel}
              description="Not available. Choose eBay, Etsy, Shopify, Facebook Marketplace, or CSV."
              showChevron={false}
              disabled
            />
          ) : null}
        </CanonicalCard>
      </CanonicalSection>

      {platformFlow.connectMode === "oauth" && isConnected ? (
        <div className="flex w-full flex-col gap-ds-2">
          {onReconnect ? (
            <Button variant="secondary" fullWidth disabled={isActionPending} onClick={onReconnect}>
              {isActionPending ? "Working…" : "Reconnect"}
            </Button>
          ) : null}
          {onDisconnect ? (
            <Button variant="ghost" fullWidth disabled={isActionPending} onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : null}
        </div>
      ) : null}

      {platformFlow.connectMode === "oauth" && !isConnected ? (
        <div className="flex w-full flex-col gap-ds-3">
          {shopRequired ? (
            <label className="flex flex-col gap-ds-1">
              <span className="text-xs font-medium text-text-secondary">Shopify store domain</span>
              <input
                className="byi-input"
                type="text"
                inputMode="url"
                autoComplete="off"
                placeholder="your-store.myshopify.com"
                value={source.storeUrl}
                onChange={(event) => onChangeSource({ storeUrl: event.target.value })}
              />
            </label>
          ) : null}
          <Button fullWidth disabled={isConnecting || !canConnectOAuth} onClick={onConnectOAuth}>
            {isConnecting ? "Checking connection…" : `Connect with ${platformLabel}`}
          </Button>
        </div>
      ) : null}

      {platformFlow.connectMode === "inline_url" || platformFlow.connectMode === "inline_file" ? (
        <MigrationSourceFields importMethod={importMethod} value={source} onChange={onChangeSource} />
      ) : null}

      <MigrationInlinePreviewPanel
        preview={inlinePreview}
        isLoading={isPreviewing}
        error={previewError}
      />
    </div>
  );
}
