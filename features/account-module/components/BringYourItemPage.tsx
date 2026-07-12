"use client";

import { CanonicalButton } from "@/src/components/canonical";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { Skeleton, SkeletonButton, SkeletonText } from "@/components/ui/Skeleton";
import { MigrationBulkPublishPanel } from "@/features/seller/migration/components/MigrationBulkPublishPanel";
import { useMarketplaceConnectors } from "@/features/seller/marketplace/hooks/use-marketplace-connectors";
import { useMigrationWizard } from "@/features/seller/migration/hooks/use-migration-wizard";
import {
  BRING_YOUR_ITEM_PROGRESS_STEPS,
  resolveBringYourItemProgress,
} from "@/lib/bring-your-item/account-progress";
import {
  clearWizardQueryKeys,
  parseBringYourItemWizardQuery,
  resolveImportErrorRecovery,
  resolveOAuthWizardError,
} from "@/lib/bring-your-item";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import type { MigrationJob, MigrationPlatformId } from "@/lib/seller/migration/types";
import { cn } from "@/lib/cn";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { focusRing } from "@/components/ui/tokens";

const PLATFORM: MigrationPlatformId = "ebay";

function BringYourItemSkeleton() {
  return (
    <div className="acm-byi__section" aria-hidden="true">
      <SkeletonText lines={2} className="mx-auto max-w-xs" />
      <SkeletonButton fullWidth height={48} />
    </div>
  );
}

function ProgressStepList({
  activeIndex,
  publishComplete,
}: {
  activeIndex: number;
  publishComplete: boolean;
}) {
  return (
    <ol className="acm-byi__steps" aria-label="Import progress">
      {BRING_YOUR_ITEM_PROGRESS_STEPS.map((step, index) => {
        const done = publishComplete ? true : index < activeIndex;
        const active = !publishComplete && index === activeIndex;
        return (
          <li
            key={step.id}
            className={
              done
                ? "acm-byi__step acm-byi__step--done"
                : active
                  ? "acm-byi__step acm-byi__step--active"
                  : "acm-byi__step"
            }
            aria-current={active ? "step" : undefined}
          >
            <span className="acm-byi__step-icon" aria-hidden>
              {done ? "✓" : active ? "…" : ""}
            </span>
            <span className="acm-byi__step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function BringYourItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wizardQuery = useMemo(() => parseBringYourItemWizardQuery(searchParams), [searchParams]);
  const autoStartRef = useRef(false);
  const resumeRef = useRef(false);
  const estimateKeyRef = useRef<string | null>(null);
  const [importLocked, setImportLocked] = useState(false);
  const connectLockRef = useRef(false);

  const { summary, loading: connectorsLoading, runAction, reload: reloadConnectors } =
    useMarketplaceConnectors();
  const [connectorActionPending, setConnectorActionPending] = useState(false);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [fetchingCount, setFetchingCount] = useState(false);
  const [publishJob, setPublishJob] = useState<MigrationJob | null>(null);
  const [retryPending, setRetryPending] = useState(false);

  const isPlatformConnected = useCallback(
    (platform: MigrationPlatformId) =>
      summary?.providers.some((provider) => provider.id === platform && provider.status === "connected") ??
      false,
    [summary?.providers],
  );

  const wizard = useMigrationWizard({
    initialPlatform: wizardQuery.initialPlatform ?? PLATFORM,
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
    isConnected,
    job,
    jobId,
    isPolling,
    importComplete,
    importFailed,
    retryImport,
    cancelImport,
    reset,
    error,
  } = wizard;

  const activeJob = publishJob ?? job;
  const oauthError = useMemo(() => resolveOAuthWizardError(wizardQuery), [wizardQuery]);
  const errorRecovery = resolveImportErrorRecovery(error ?? oauthError);
  const publishComplete = activeJob?.publishStatus === "completed";

  const progressState = useMemo(
    () =>
      resolveBringYourItemProgress({
        connectorsLoading,
        connectorActionPending,
        isConnected,
        fetchingCount,
        step,
        isPolling,
        isSubmitting,
        importComplete,
        importFailed,
        job: activeJob,
        listingCount,
      }),
    [
      activeJob,
      connectorActionPending,
      connectorsLoading,
      fetchingCount,
      importComplete,
      importFailed,
      isConnected,
      isPolling,
      isSubmitting,
      listingCount,
      step,
    ],
  );

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

  useEffect(() => {
    if (!isConnected) {
      estimateKeyRef.current = null;
      return;
    }
    if (importComplete || step === 3) return;

    const cacheKey = "ebay-connected";
    if (estimateKeyRef.current === cacheKey) return;
    estimateKeyRef.current = cacheKey;

    let cancelled = false;
    setFetchingCount(true);
    void fetch(`/api/seller/migration/estimate?platform=${PLATFORM}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { total?: number } | null) => {
        if (!cancelled && payload && typeof payload.total === "number") {
          setListingCount(payload.total);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFetchingCount(false);
      });

    return () => {
      cancelled = true;
    };
  }, [importComplete, isConnected, step]);

  const handleConnectOAuth = useCallback(() => {
    if (connectLockRef.current) return;
    connectLockRef.current = true;
    const returnTo = `${BRING_YOUR_ITEM_PATH}?platform=${PLATFORM}`;
    window.location.href = `/api/seller/marketplace/oauth/${PLATFORM}/authorize?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  const handleReconnect = useCallback(async () => {
    if (connectorActionPending) return;
    setConnectorActionPending(true);
    try {
      await runAction(PLATFORM, "refresh_token");
      await reloadConnectors();
      setError(null);
    } catch {
      handleConnectOAuth();
    } finally {
      setConnectorActionPending(false);
    }
  }, [connectorActionPending, handleConnectOAuth, reloadConnectors, runAction, setError]);

  const handleStartImport = useCallback(async () => {
    if (importLocked || isSubmitting || !canStartImport) return;
    setImportLocked(true);
    try {
      await startImport();
    } finally {
      setImportLocked(false);
    }
  }, [canStartImport, importLocked, isSubmitting, startImport]);

  const handleRetryFailedItems = useCallback(async () => {
    if (!jobId || retryPending) return;
    setRetryPending(true);
    setError(null);
    try {
      if (importComplete) {
        const response = await fetch(`/api/seller/migration/${jobId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "retry_failed" }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to retry failed items.");
        }
        const payload = (await response.json()) as { job: MigrationJob };
        setPublishJob(payload.job);
      } else {
        const response = await fetch(`/api/seller/migration/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "process" }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to retry failed items.");
        }
        const payload = (await response.json()) as { job: MigrationJob };
        setPublishJob(payload.job);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry failed items.");
    } finally {
      setRetryPending(false);
    }
  }, [importComplete, jobId, retryPending, setError]);

  const handleImportMore = useCallback(() => {
    reset();
    setPublishJob(null);
    setListingCount(null);
    setImportLocked(false);
    estimateKeyRef.current = null;
    autoStartRef.current = false;
    resumeRef.current = false;
    router.replace(BRING_YOUR_ITEM_PATH, { scroll: false });
  }, [reset, router]);

  const isPublishing =
    activeJob?.publishStatus === "queued" || activeJob?.publishStatus === "publishing";
  const partialFailure =
    (importComplete && (activeJob?.report?.errors ?? 0) > 0) ||
    (importFailed && (activeJob?.report?.imported ?? 0) > 0);
  const showProcessing =
    !publishComplete &&
    (connectorsLoading ||
      connectorActionPending ||
      fetchingCount ||
      isPublishing ||
      (step === 3 && (isPolling || isSubmitting) && !importComplete));
  const readyCount = progressState.readyCount;
  const importedCount = progressState.importedCount;
  const publishedCount = progressState.publishedCount;

  return (
    <AccountCanonicalShell title="Bring Your Item" backHref="/account">
      <div className="acm-byi" data-bring-your-item-version="v1.0">
        <div className="acm-byi__intro">
          <p className="acm-byi__subtitle">Import your eBay listings into ROVEXO.</p>
        </div>

        {error || oauthError ? (
          <div className="acm-byi__alert" role="alert" aria-live="assertive">
            <p className="acm-byi__alert-title">{errorRecovery.title}</p>
            <p className="acm-byi__alert-message">{errorRecovery.message}</p>
            <div className="acm-byi__actions">
              {errorRecovery.canRetry ? (
                <CanonicalButton fullWidth onClick={() => void handleReconnect()} disabled={connectorActionPending}>
                  Reconnect
                </CanonicalButton>
              ) : null}
              {errorRecovery.canRetry ? (
                <CanonicalButton fullWidth variant="outline" onClick={() => void retryImport()} disabled={retryPending}>
                  Retry
                </CanonicalButton>
              ) : null}
              {errorRecovery.canCancel ? (
                <CanonicalButton fullWidth variant="outline" onClick={() => void cancelImport()}>
                  Cancel
                </CanonicalButton>
              ) : null}
            </div>
          </div>
        ) : null}

        {publishComplete ? (
          <div className="acm-byi__section acm-byi__success" role="status" aria-live="polite">
            <p className="acm-byi__success-title">✅ Import completed successfully</p>
            <dl className="acm-byi__success-stats">
              <div>
                <dt>Imported</dt>
                <dd>{importedCount} listings</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{publishedCount} listings</dd>
              </div>
            </dl>
            <div className="acm-byi__actions">
              <Link
                href="/seller/listings"
                className={cn(
                  "inline-flex w-full items-center justify-center",
                  buttonVariants.primary,
                  buttonSizes.md,
                  focusRing,
                )}
              >
                View My Listings
              </Link>
              <Link
                href="/"
                className={cn(
                  "inline-flex w-full items-center justify-center",
                  buttonVariants.outline,
                  buttonSizes.md,
                  focusRing,
                )}
              >
                Go to Homepage
              </Link>
              <CanonicalButton fullWidth variant="outline" onClick={handleImportMore}>
                Import More
              </CanonicalButton>
            </div>
          </div>
        ) : null}

        {!publishComplete && connectorsLoading && !isConnected ? <BringYourItemSkeleton /> : null}

        {!publishComplete && !isConnected && !connectorsLoading && !(error || oauthError) ? (
          <div className="acm-byi__section">
            <CanonicalButton fullWidth onClick={handleConnectOAuth}>
              Connect eBay
            </CanonicalButton>
          </div>
        ) : null}

        {!publishComplete && isConnected && step === 2 && !importComplete ? (
          <div className="acm-byi__section">
            <p className="acm-byi__status" role="status">
              <span className="acm-byi__check" aria-hidden>
                ✓
              </span>{" "}
              Connected to eBay
            </p>
            {fetchingCount ? (
              <div className="acm-byi__count-skeleton" aria-hidden>
                <Skeleton className="mx-auto h-5 w-40" />
              </div>
            ) : (
              <p className="acm-byi__count" role="status">
                {listingCount ?? 0} Listings Found
              </p>
            )}
            <CanonicalButton
              fullWidth
              disabled={!canStartImport || isSubmitting || fetchingCount || importLocked}
              onClick={() => void handleStartImport()}
            >
              {isSubmitting ? "Starting…" : "Import Listings"}
            </CanonicalButton>
          </div>
        ) : null}

        {!publishComplete && showProcessing ? (
          <div className="acm-byi__section" aria-live="polite">
            <ProgressStepList activeIndex={progressState.activeIndex} publishComplete={false} />
            <div className="acm-byi__progress-wrap">
              <div
                className="acm-byi__progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressState.progressPercent}
                aria-label="Import progress"
              >
                <div
                  className="acm-byi__progress-fill"
                  style={{ width: `${progressState.progressPercent}%` }}
                />
              </div>
              <p className="acm-byi__progress-label">{progressState.progressPercent}%</p>
            </div>
          </div>
        ) : null}

        {!publishComplete && importComplete && job && !isPublishing ? (
          <div className="acm-byi__section">
            <p className="acm-byi__status" role="status">
              <span className="acm-byi__check" aria-hidden>
                ✓
              </span>{" "}
              Import Complete
            </p>
            <p className="acm-byi__count" role="status">
              {readyCount} Listings Ready
            </p>
            <MigrationBulkPublishPanel job={job} minimal onJobUpdate={setPublishJob} />
          </div>
        ) : null}

        {!publishComplete && step === 3 && (isPolling || isSubmitting) && !importFailed ? (
          <div className="acm-byi__section">
            <CanonicalButton fullWidth variant="outline" onClick={() => void cancelImport()} disabled={retryPending}>
              Cancel
            </CanonicalButton>
          </div>
        ) : null}

        {!publishComplete && partialFailure && !error ? (
          <div className="acm-byi__section">
            <CanonicalButton fullWidth onClick={() => void handleRetryFailedItems()} disabled={retryPending}>
              {retryPending ? "Retrying…" : "Retry Failed Items"}
            </CanonicalButton>
          </div>
        ) : null}
      </div>
    </AccountCanonicalShell>
  );
}
