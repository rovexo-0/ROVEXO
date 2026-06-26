"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StickyPageHeader } from "@/components/ui/StickyPageHeader";
import { MigrationStepIndicator } from "@/features/seller/migration/components/MigrationStepIndicator";
import { useMigrationWizard } from "@/features/seller/migration/hooks/use-migration-wizard";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const MigrationPlatformStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationPlatformStep").then(
      (mod) => mod.MigrationPlatformStep,
    ),
  { loading: () => <StepSkeleton /> },
);

const MigrationImportMethodStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationImportMethodStep").then(
      (mod) => mod.MigrationImportMethodStep,
    ),
  { loading: () => <StepSkeleton /> },
);

const MigrationPreviewStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationPreviewStep").then(
      (mod) => mod.MigrationPreviewStep,
    ),
  { loading: () => <StepSkeleton /> },
);

const MigrationProgressStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationProgressStep").then(
      (mod) => mod.MigrationProgressStep,
    ),
  { loading: () => <StepSkeleton /> },
);

const MigrationReportStep = dynamic(
  () =>
    import("@/features/seller/migration/components/steps/MigrationReportStep").then(
      (mod) => mod.MigrationReportStep,
    ),
  { loading: () => <StepSkeleton /> },
);

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function StepSkeleton() {
  return <div className="h-48 animate-pulse rounded-ds-lg bg-surface" aria-hidden />;
}

export function MigrationCenterPage() {
  const router = useRouter();
  const wizard = useMigrationWizard();

  const handlePrimary = async () => {
    if (wizard.step === 3) {
      await wizard.createJob();
      return;
    }
    if (wizard.step === 4) {
      await wizard.startMigration();
      return;
    }
    wizard.goNext();
  };

  const primaryLabel =
    wizard.step === 3
      ? "Prepare migration"
      : wizard.step === 4
        ? "Run migration"
        : wizard.step === 5
          ? null
          : "Continue";

  const canPrimary =
    wizard.step === 1
      ? wizard.canAdvanceFromStep1
      : wizard.step === 2
        ? wizard.canAdvanceFromStep2
        : wizard.step === 3 || wizard.step === 4;

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto w-full max-w-2xl bg-white px-5 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <StickyPageHeader>
          <div className="flex items-center gap-ds-2">
            <IconButton
              label="Back to seller dashboard"
              onClick={() => router.push("/seller/dashboard")}
              className={focusRing}
            >
              <BackIcon className="h-5 w-5" />
            </IconButton>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-text-primary">Migration Center</h1>
              <p className="truncate text-xs text-text-secondary">Bring your items to ROVEXO</p>
            </div>
          </div>
        </StickyPageHeader>

        <div className="mt-ds-4 flex flex-col gap-ds-4">
          <MigrationStepIndicator currentStep={wizard.step} />

          {wizard.error ? (
            <Card padding="sm" className="border-error/30 bg-error/5" role="alert">
              <p className="text-sm text-error">{wizard.error}</p>
            </Card>
          ) : null}

          <Card padding="lg" className="">
            {wizard.step === 1 ? (
              <MigrationPlatformStep
                selected={wizard.platform}
                onSelect={wizard.selectPlatform}
              />
            ) : null}
            {wizard.step === 2 ? (
              <MigrationImportMethodStep
                selected={wizard.importMethod}
                onSelect={wizard.selectImportMethod}
              />
            ) : null}
            {wizard.step === 3 ? (
              <MigrationPreviewStep
                items={wizard.previewItems}
                platformLabel={wizard.platformLabel}
                methodLabel={wizard.methodLabel}
              />
            ) : null}
            {wizard.step === 4 ? (
              <MigrationProgressStep
                job={wizard.job}
                isSubmitting={wizard.isSubmitting}
                platformLabel={wizard.platformLabel}
              />
            ) : null}
            {wizard.step === 5 ? (
              <MigrationReportStep job={wizard.job} onStartAnother={wizard.reset} />
            ) : null}
          </Card>

          {primaryLabel ? (
            <div className="flex flex-col gap-ds-2 sm:flex-row">
              {wizard.step > 1 && wizard.step < 5 ? (
                <Button variant="outline" fullWidth onClick={wizard.goBack} disabled={wizard.isSubmitting}>
                  Back
                </Button>
              ) : null}
              <Button
                fullWidth
                disabled={!canPrimary || wizard.isSubmitting}
                onClick={handlePrimary}
                className={cn(wizard.step === 1 ? "w-full" : "")}
              >
                {wizard.isSubmitting ? "Working…" : primaryLabel}
              </Button>
            </div>
          ) : (
            <Link
              href="/seller/dashboard"
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-ds-md border border-border px-ds-4 text-sm font-medium text-text-primary",
                focusRing,
              )}
            >
              Back to dashboard
            </Link>
          )}
        </div>
      </main>
    </BetaAppShell>
  );
}
