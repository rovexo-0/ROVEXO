"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MarketplaceProviderView } from "@/lib/seller/marketplace/types";

type MarketplaceConnectorSettingsModalProps = {
  provider: MarketplaceProviderView | null;
  open: boolean;
  onClose: () => void;
  onConnect: (
    platform: string,
    credentials: {
      storeUrl?: string;
      apiKey?: string;
      apiSecret?: string;
      accessToken?: string;
      fileName?: string;
    },
  ) => Promise<void>;
  onAction: (
    platform: string,
    action: "enable" | "disable" | "disconnect" | "delete_credentials" | "reset" | "health_check" | "retry",
  ) => Promise<void>;
};

export function MarketplaceConnectorSettingsModal({
  provider,
  open,
  onClose,
  onConnect,
  onAction,
}: MarketplaceConnectorSettingsModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !provider) return null;

  const needsOAuth = provider.authenticationType === "oauth2";
  const needsStoreUrl =
    provider.id === "shopify" ||
    (provider.capabilities.apiImport && !needsOAuth);
  const needsApiKey = provider.authenticationType === "api_key";
  const needsToken = provider.authenticationType === "bearer_token";
  const needsFile = provider.capabilities.fileImport;

  const handleOAuthConnect = () => {
    const returnTo = `/seller/connectors`;
    const shopParam =
      provider.id === "shopify" && storeUrl.trim()
        ? `&shop=${encodeURIComponent(storeUrl.trim())}`
        : "";
    window.location.href = `/api/seller/marketplace/oauth/${provider.id}/authorize?returnTo=${encodeURIComponent(returnTo)}${shopParam}`;
  };

  const handleConnect = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConnect(provider.id, {
        storeUrl: storeUrl || undefined,
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        accessToken: accessToken || undefined,
        fileName: fileName || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    action: "enable" | "disable" | "disconnect" | "delete_credentials" | "reset" | "health_check" | "retry",
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      await onAction(provider.id, action);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      zIndex={120}
      ariaLabelledBy="connector-settings-title"
      panelClassName="p-ds-5"
    >
        <div className="flex items-start gap-ds-3">
          <span className="text-2xl" aria-hidden>
            {provider.logo}
          </span>
          <div>
            <h2 id="connector-settings-title" className="text-base font-semibold text-text-primary">
              {provider.name}
            </h2>
            <p className="mt-ds-1 text-xs text-text-secondary">Version {provider.version}</p>
          </div>
        </div>

        {error ? (
          <p className="mt-ds-3 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-ds-4 flex flex-col gap-ds-3">
          {needsOAuth ? (
            <Button fullWidth disabled={submitting} onClick={handleOAuthConnect}>
              Connect with {provider.name}
            </Button>
          ) : null}
          {needsStoreUrl ? (
            <label className="flex flex-col gap-ds-1 text-sm">
              <span className="text-text-secondary">Store URL</span>
              <input
                className="rounded-ds-md border border-border px-ds-3 py-ds-2"
                value={storeUrl}
                onChange={(event) => setStoreUrl(event.target.value)}
                placeholder="https://your-store.example"
              />
            </label>
          ) : null}
          {needsApiKey ? (
            <label className="flex flex-col gap-ds-1 text-sm">
              <span className="text-text-secondary">API key</span>
              <input
                className="rounded-ds-md border border-border px-ds-3 py-ds-2"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="off"
              />
            </label>
          ) : null}
          {needsApiKey ? (
            <label className="flex flex-col gap-ds-1 text-sm">
              <span className="text-text-secondary">API secret</span>
              <input
                type="password"
                className="rounded-ds-md border border-border px-ds-3 py-ds-2"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
                autoComplete="off"
              />
            </label>
          ) : null}
          {needsToken ? (
            <label className="flex flex-col gap-ds-1 text-sm">
              <span className="text-text-secondary">Access token</span>
              <input
                type="password"
                className="rounded-ds-md border border-border px-ds-3 py-ds-2"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
                autoComplete="off"
              />
            </label>
          ) : null}
          {needsFile ? (
            <label className="flex flex-col gap-ds-1 text-sm">
              <span className="text-text-secondary">File name</span>
              <input
                className="rounded-ds-md border border-border px-ds-3 py-ds-2"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="inventory.csv"
              />
            </label>
          ) : null}
        </div>

        <div className="mt-ds-4 flex flex-col gap-ds-2">
          <Button fullWidth disabled={submitting} onClick={() => void handleConnect()}>
            {submitting ? "Connecting…" : "Connect"}
          </Button>
          <Button
            fullWidth
            variant="outline"
            disabled={submitting}
            onClick={() => void handleAction(provider.enabled ? "disable" : "enable")}
          >
            {provider.enabled ? "Disable" : "Enable"}
          </Button>
          <Button
            fullWidth
            variant="outline"
            disabled={submitting}
            onClick={() => void handleAction("health_check")}
          >
            Run health check
          </Button>
          {provider.retryAvailable ? (
            <Button fullWidth variant="outline" disabled={submitting} onClick={() => void handleAction("retry")}>
              Retry connection
            </Button>
          ) : null}
          <Button
            fullWidth
            variant="outline"
            disabled={submitting}
            onClick={() => void handleAction("disconnect")}
          >
            Disconnect
          </Button>
          <Button
            fullWidth
            variant="outline"
            disabled={submitting}
            onClick={() => void handleAction("delete_credentials")}
          >
            Delete credentials
          </Button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={cn(
              "min-h-ds-7 rounded-ds-lg px-ds-4 py-ds-3 text-sm font-semibold text-text-primary",
              focusRing,
            )}
          >
            Close
          </button>
        </div>
    </ModalContainer>
  );
}
