import type { MigrationJob } from "@/lib/seller/migration/types";

export const BRING_YOUR_ITEM_PROGRESS_STEPS = [
  { id: "connecting", label: "Connecting…" },
  { id: "fetching", label: "Fetching listings…" },
  { id: "importing", label: "Importing…" },
  { id: "optimising", label: "Optimising images…" },
  { id: "categorising", label: "AI categorising…" },
  { id: "publishing", label: "Publishing…" },
  { id: "completed", label: "Completed ✓" },
] as const;

export type BringYourItemProgressStepId = (typeof BRING_YOUR_ITEM_PROGRESS_STEPS)[number]["id"];

export type BringYourItemProgressInput = {
  connectorsLoading: boolean;
  connectorActionPending: boolean;
  isConnected: boolean;
  fetchingCount: boolean;
  step: number;
  isPolling: boolean;
  isSubmitting: boolean;
  importComplete: boolean;
  importFailed: boolean;
  job: MigrationJob | null;
  listingCount: number | null;
};

export type BringYourItemProgressState = {
  activeStepId: BringYourItemProgressStepId;
  activeIndex: number;
  progressPercent: number;
  showStepList: boolean;
  importedCount: number;
  readyCount: number;
  publishedCount: number;
};

function stepIndex(id: BringYourItemProgressStepId): number {
  return BRING_YOUR_ITEM_PROGRESS_STEPS.findIndex((step) => step.id === id);
}

function resolveImportSubStep(job: MigrationJob): BringYourItemProgressStepId {
  const live = job.progress;
  const total = job.itemsTotal || live?.listingsFound || 0;
  const imported = live?.imported ?? job.report?.imported ?? 0;
  const images = live?.imagesOptimized ?? live?.images ?? job.report?.images ?? 0;
  const categories = live?.categories ?? 0;

  if (total > 0 && imported < total) return "importing";
  if (imported > 0 && images < imported) return "optimising";
  if (imported > 0 && categories < imported) return "categorising";
  return "importing";
}

function resolvePublishSubStep(job: MigrationJob): BringYourItemProgressStepId {
  const progress = job.publishProgress;
  if (!progress) return "publishing";
  if (progress.categoriesMapped < progress.imported) return "categorising";
  if (progress.imagesProcessed < progress.imported) return "optimising";
  return "publishing";
}

export function resolveBringYourItemProgress(input: BringYourItemProgressInput): BringYourItemProgressState {
  const {
    connectorsLoading,
    connectorActionPending,
    isConnected,
    fetchingCount,
    step,
    isPolling,
    isSubmitting,
    importComplete,
    job,
    listingCount,
  } = input;

  const importedCount = job?.report?.imported ?? job?.progress?.imported ?? 0;
  const readyCount = job?.itemsTotal ?? job?.progress?.listingsFound ?? listingCount ?? importedCount;
  const publishedCount =
    job?.publishReport?.published ?? job?.publishProgress?.published ?? job?.report?.published ?? 0;

  let activeStepId: BringYourItemProgressStepId = "connecting";

  if (job?.publishStatus === "completed") {
    activeStepId = "completed";
  } else if (job?.publishStatus === "queued" || job?.publishStatus === "publishing") {
    activeStepId = resolvePublishSubStep(job);
  } else if (step === 3 && (isPolling || isSubmitting) && job) {
    activeStepId = resolveImportSubStep(job);
  } else if (importComplete) {
    activeStepId = "categorising";
  } else if (fetchingCount || (isConnected && listingCount == null && step === 2)) {
    activeStepId = "fetching";
  } else if (connectorsLoading || connectorActionPending || !isConnected) {
    activeStepId = "connecting";
  } else if (isConnected) {
    activeStepId = "fetching";
  }

  const activeIndex = stepIndex(activeStepId);

  let progressPercent = 0;
  if (job?.publishStatus === "completed") {
    progressPercent = 100;
  } else if (job?.publishStatus === "queued" || job?.publishStatus === "publishing") {
    progressPercent = job.publishProgress?.progressPercent ?? 5;
  } else if (step === 3 && job) {
    progressPercent = job.progressPercent ?? 0;
    if (progressPercent <= 0 && (isPolling || isSubmitting)) progressPercent = 5;
  } else if (activeStepId === "fetching" && listingCount != null) {
    progressPercent = 100;
  } else if (activeStepId === "connecting" && isConnected) {
    progressPercent = 100;
  }

  const showStepList =
    connectorsLoading ||
    connectorActionPending ||
    fetchingCount ||
    step === 3 ||
    job?.publishStatus === "queued" ||
    job?.publishStatus === "publishing" ||
    job?.publishStatus === "completed";

  return {
    activeStepId,
    activeIndex,
    progressPercent: Math.min(100, Math.max(0, Math.round(progressPercent))),
    showStepList,
    importedCount,
    readyCount,
    publishedCount,
  };
}
