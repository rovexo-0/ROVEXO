"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PageBack } from "@/components/navigation/PageBack";
import { Button } from "@/components/ui/Button";
import { StickyPageHeader } from "@/components/ui/StickyPageHeader";
import { MigrationStepIndicator } from "@/features/seller/migration/components/MigrationStepIndicator";
import { useMarketplaceConnectors } from "@/features/seller/marketplace/hooks/use-marketplace-connectors";
import { useMigrationWizard } from "@/features/seller/migration/hooks/use-migration-wizard";
import {
  clearWizardQueryKeys,
  parseBringYourItemWizardQuery,
  resolveImportErrorRecovery,
  resolveOAuthWizardError,
} from "@/lib/bring-your-item";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const MigrationPlatformStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationPlatformStep").then(
      (mod) => mod.MigrationPlatformStep,
    ),
  { loading: () => <StepSkeleton /> },
);

const MigrationConnectStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationConnectStep").then(
      (mod) => mod.MigrationConnectStep,
    ),
  { loading: () => <StepSkeleton /> },
);

const MigrationImportStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationImportStep").then(
      (mod) => mod.MigrationImportStep,
    ),
  { loading: () => <StepSkeleton /> },
);

function StepSkeleton() {
  return (
    <div className="byi-panel__body" aria-hidden>
      <div className="h-48 animate-pulse rounded-ds-lg bg-surface" />
    </div>
  );
}

export function MigrationCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wizardQuery = useMemo(() => parseBringYourItemWizardQuery(searchParams), [searchParams]);
  const autoStartRef = useRef(false);
  const resumeRef = useRef(false);

  const { summary, loading: connectorsLoading, runAction, reload: reloadConnectors } =
    useMarketplaceConnectors();
  const [connectorActionPending, setConnectorActionPending] = useState(false);

  const connectedPlatformIds = useMemo(() => {
    const ids = new Set<string>();
    for (const provider of summary?.providers ?? []) {
      if (provider.status === "connected") ids.add(provider.id);
    }
    return ids;
  }, [summary?.providers]);

  const isPlatformConnected = useCallback(
    (platform: MigrationPlatformId) => connectedPlatformIds.has(platform),
    [connectedPlatformIds],
  );

  const wizard = useMigrationWizard({
    initialPlatform: wizardQuery.initialPlatform,
    resumeJobId: wizardQuery.resumeJobId,
    isPlatformConnected,
  });

  const {
    setError,
    resumeJob,
    startImport,
    step,
    canStartImport,
    isSubmitting,
    platform,
    platformFlow,
    platformLabel,
    importMethod,
    source,
    selectPlatform,
    updateSource,
    isConnected,
    job,
    jobId,
    queueItems,
    setQueueItems,
    isPolling,
    importComplete,
    importFailed,
    reset,
    retryImport,
    cancelImport,
    goBack,
    error,
    inlinePreview,
    isPreviewing,
    previewError,
  } = wizard;

  const oauthError = useMemo(() => resolveOAuthWizardError(wizardQuery), [wizardQuery]);
  const errorRecovery = resolveImportErrorRecovery(error ?? oauthError);

  useEffect(() => {
    if (oauthError) setError(oauthError);
  }, [oauthError, setError]);

  useEffect(() => {
    if (!wizardQuery.resumeJobId || resumeRef.current) return;
    resumeRef.current = true;
    void resumeJob(wizardQuery.resumeJobId).then(() => {
      router.replace(clearWizardQueryKeys(["job"]), { scroll: false });
    });
  }, [resumeJob, router, wizardQuery.resumeJobId]);

  useEffect(() => {
    if (!wizardQuery.oauthConnected || autoStartRef.current) return;
    if (step !== 2 || !canStartImport || isSubmitting) return;
    autoStartRef.current = true;
    void startImport().then(() => {
      router.replace(clearWizardQueryKeys(["connected", "oauth"]), { scroll: false });
    });
  }, [canStartImport, isSubmitting, router, startImport, step, wizardQuery.oauthConnected]);

  const activeProvider = useMemo(
    () => summary?.providers.find((provider) => provider.id === platform) ?? null,
    [platform, summary?.providers],
  );

  const handleConnectOAuth = useCallback(() => {
    if (!platform) return;
    const returnTo = `${BRING_YOUR_ITEM_PATH}?platform=${platform}`;
    const params = new URLSearchParams({ returnTo });
    if (platform === "shopify" && source.storeUrl.trim()) {
      params.set("shop", source.storeUrl.trim());
    }
    window.location.href = `/api/seller/marketplace/oauth/${platform}/authorize?${params.toString()}`;
  }, [platform, source.storeUrl]);

  const handleDisconnect = useCallback(async () => {
    if (!platform) return;
    setConnectorActionPending(true);
    try {
      await runAction(platform, "disconnect");
    } finally {
      setConnectorActionPending(false);
    }
  }, [platform, runAction]);

  const handleReconnect = useCallback(async () => {
    if (!platform) return;
    setConnectorActionPending(true);
    try {
      await runAction(platform, "refresh_token");
      await reloadConnectors();
    } catch {
      handleConnectOAuth();
    } finally {
      setConnectorActionPending(false);
    }
  }, [handleConnectOAuth, platform, reloadConnectors, runAction]);

  const showFooterActions = step === 2 && !isSubmitting;
  const primaryLabel = "Import";

  return (
    <BetaAppShell showBottomNav={false} bottomNavTab="account">
      <main className="account-center-shell mx-auto w-full max-w-[480px] bg-background px-ds-4 py-ds-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <StickyPageHeader>
          <div className="flex items-center gap-ds-2">
            <PageBack backHref="/account" backLabel="My Account" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-text-primary">Bring Your Item</h1>
              <p className="truncate text-xs text-text-secondary">Import listings in a few taps</p>
            </div>
          </div>
        </StickyPageHeader>

        <section className="byi-hero mt-ds-4" aria-labelledby="byi-hero-title">
          <p className="byi-hero__eyebrow">Marketplace import</p>
          <h2 id="byi-hero-title" className="byi-hero__title">
            Move your listings to ROVEXO
          </h2>
          <p className="byi-hero__subtitle">
            Choose where your items live, connect once, and import with batch support, duplicate detection,
            and resume.
          </p>
        </section>

        <MigrationStepIndicator currentStep={step} />

        {error ? (
          <div className="byi-alert" role="alert" aria-live="assertive">
            <p className="byi-alert__title">{errorRecovery.title}</p>
            <p className="byi-alert__message">{errorRecovery.message}</p>
          </div>
        ) : null}

        <section className="byi-panel" aria-live="polite">
          {step === 1 ? (
            <MigrationPlatformStep
              selected={platform}
              onSelect={selectPlatform}
              connectedPlatformIds={connectedPlatformIds}
            />
          ) : null}
          {step === 2 ? (
            <MigrationConnectStep
              platformId={platform}
              platformLabel={platformLabel}
              platformFlow={platformFlow}
              importMethod={importMethod}
              source={source}
              onChangeSource={updateSource}
              isConnected={isConnected}
              isConnecting={connectorsLoading}
              onConnectOAuth={handleConnectOAuth}
              onDisconnect={platformFlow?.connectMode === "oauth" ? () => void handleDisconnect() : undefined}
              onReconnect={platformFlow?.connectMode === "oauth" ? () => void handleReconnect() : undefined}
              connectionHealth={activeProvider?.healthStatus ?? null}
              lastSyncAt={activeProvider?.lastSyncAt ?? null}
              lastError={activeProvider?.lastError ?? null}
              isActionPending={connectorActionPending}
              inlinePreview={inlinePreview}
              isPreviewing={isPreviewing}
              previewError={previewError}
            />
          ) : null}
          {step === 3 ? (
            <MigrationImportStep
              job={job}
              jobId={jobId}
              queueItems={queueItems}
              onQueueItemsChange={setQueueItems}
              isSubmitting={isSubmitting}
              isPolling={isPolling}
              platformLabel={platformLabel}
              importComplete={importComplete}
              importFailed={importFailed}
              onStartAnother={reset}
              onRetry={retryImport}
              onCancel={cancelImport}
            />
          ) : null}
        </section>

        {showFooterActions ? (
          <div className="byi-actions">
            <Button variant="outline" fullWidth onClick={goBack} disabled={isSubmitting}>
              Back
            </Button>
            <Button fullWidth disabled={!canStartImport || isSubmitting} onClick={() => void startImport()}>
              {isSubmitting ? "Starting…" : primaryLabel}
            </Button>
          </div>
        ) : step === 3 && importComplete ? (
          <Link
            href="/seller"
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-ds-md border border-border px-ds-4 text-sm font-medium text-text-primary",
              focusRing,
            )}
          >
            Back to dashboard
          </Link>
        ) : null}
      </main>
    </BetaAppShell>
  );
}
