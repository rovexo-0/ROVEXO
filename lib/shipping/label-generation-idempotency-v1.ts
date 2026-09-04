/**
 * MEDIUM #7 — Duplicate Shipment / Label Protection (v1).
 *
 * Canonical law for one order:
 * - one active shipping_records row (DB unique on order_id)
 * - one active parcel attempt per label operation
 * - label generation is idempotent (reuse ready / in-flight / provider parcel)
 * - concurrent POSTs must not create two Sendcloud labels
 * - retry after timeout must reuse existing result when already created
 * - recovery may append a new parcel ONLY when explicitly authorized
 * - failed historical parcels are never selected as the active label target
 * - shipping_records remains the sole write SSOT (order_shipments read-only)
 *
 * Pure decision helpers + claim outcome typing. DB claim lives in parcels-repository.
 */

import type { ShipmentParcel, ShipmentParcelLabel } from "@/lib/shipping/types";
import {
  isActiveAnnouncedOrReadyParcel,
  isEligibleForNewLabel,
  isFailedHistoricalParcel,
} from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";

export const LABEL_GENERATION_IDEMPOTENCY_V1 = {
  version: "v1.0",
  medium: "MEDIUM_7_DUPLICATE_SHIPMENT_LABEL_PROTECTION",
  equation:
    "ONE_ORDER = ONE_ACTIVE_SHIPPING_RECORD = ONE_ACTIVE_LABEL_ATTEMPT_PER_PARCEL = IDEMPOTENT_LABEL",
  ssot: "shipping_records",
  legacyReadOnly: "order_shipments",
  recoveryNewParcel: "explicit_authorize_only",
  claimTable: "shipping_labels_v1",
  claimUnique: "shipment_parcel_id",
} as const;

export const LABEL_GENERATION_IN_PROGRESS_MESSAGE =
  "Label generation is already in progress for this parcel. Please retry shortly.";

export const RECOVERY_PARCEL_UNAUTHORIZED_MESSAGE =
  "Recovery parcel creation requires explicit authorization.";

/** Stable Sendcloud external_reference / announce idempotency key (existing format). */
export function buildLabelGenerationIdempotencyKey(
  orderId: string,
  parcelNumber: number,
): string {
  return `rovexo-order-${orderId}-parcel-${parcelNumber}`;
}

export function hasUsableReadyLabelArtifact(input: {
  label: ShipmentParcelLabel | null | undefined;
  trackingNumber: string | null | undefined;
}): boolean {
  return (
    input.label?.status === "ready" &&
    Boolean(input.trackingNumber?.trim()) &&
    Boolean(input.label.pdfUrl)
  );
}

export function hasReusableProviderParcelId(
  providerParcelId: number | null | undefined,
): boolean {
  return providerParcelId != null && providerParcelId > 0;
}

/**
 * Whether a retry / concurrent request may create a brand-new provider parcel.
 * False when a ready label or provider identity already exists.
 */
export function mayCreateNewProviderParcelAttempt(input: {
  parcel: ShipmentParcel;
  existingProviderParcelId?: number | null;
}): boolean {
  if (
    hasUsableReadyLabelArtifact({
      label: input.parcel.label,
      trackingNumber: input.parcel.trackingNumber,
    })
  ) {
    return false;
  }
  if (hasReusableProviderParcelId(input.existingProviderParcelId)) return false;
  if (hasReusableProviderParcelId(input.parcel.providerParcelId)) return false;
  if (isFailedHistoricalParcel(input.parcel)) return false;
  return isEligibleForNewLabel(input.parcel) || input.parcel.status === "preparing";
}

/**
 * Recovery may append a new parcel only with an explicit authorize flag.
 * Simple retries must never append.
 */
export function isRecoveryParcelAttemptAuthorized(
  authorizeRecoveryParcelAttempt: boolean | undefined,
): boolean {
  return authorizeRecoveryParcelAttempt === true;
}

/**
 * Active parcel among a multi-parcel / recovered order:
 * prefer announced/ready; never prefer failed historical.
 */
export function selectActiveParcelForLabelProtection(
  parcels: ShipmentParcel[],
): ShipmentParcel | null {
  const active = parcels.filter(isActiveAnnouncedOrReadyParcel);
  if (active.length === 1) return active[0]!;
  if (active.length > 1) {
    return active.reduce((best, current) =>
      current.parcelNumber > best.parcelNumber ? current : best,
    );
  }
  const eligible = parcels.filter(isEligibleForNewLabel);
  if (eligible.length === 1) return eligible[0]!;
  return null;
}

export function isHistoricalFailedParcelSafeFromActiveSelection(
  parcel: ShipmentParcel,
  active: ShipmentParcel | null,
): boolean {
  if (!isFailedHistoricalParcel(parcel)) return true;
  if (!active) return true;
  return active.id !== parcel.id;
}

export type LabelGenerationClaimDecision =
  | { action: "return_ready"; reason: "ready_label" }
  | { action: "reuse_provider"; reason: "provider_parcel_exists"; providerParcelId: number }
  | { action: "wait_in_flight"; reason: "claim_held_by_peer" }
  | { action: "proceed"; reason: "claimed" | "no_claim_row" | "stale_pending_reclaimed" };

/**
 * Pure interpreter for a claim row read after INSERT conflict or SELECT.
 * Does not perform I/O.
 */
export function decideLabelGenerationClaim(input: {
  labelStatus: string | null | undefined;
  trackingNumber: string | null | undefined;
  pdfUrl: string | null | undefined;
  providerParcelId: number | null | undefined;
  claimedByThisRequest: boolean;
}): LabelGenerationClaimDecision {
  if (input.claimedByThisRequest) {
    return { action: "proceed", reason: "claimed" };
  }

  const ready =
    input.labelStatus === "ready" &&
    Boolean(input.trackingNumber?.trim()) &&
    Boolean(input.pdfUrl);

  if (ready) {
    return { action: "return_ready", reason: "ready_label" };
  }

  if (hasReusableProviderParcelId(input.providerParcelId)) {
    return {
      action: "reuse_provider",
      reason: "provider_parcel_exists",
      providerParcelId: input.providerParcelId as number,
    };
  }

  if (input.labelStatus === "pending") {
    return { action: "wait_in_flight", reason: "claim_held_by_peer" };
  }

  // void / missing / unknown → caller may reclaim
  return { action: "proceed", reason: "stale_pending_reclaimed" };
}

export type LabelGenerationClaimOutcome =
  | {
      outcome: "claimed";
    }
  | {
      outcome: "reuse_ready";
      trackingNumber: string;
      pdfUrl: string;
      labelStatus: "ready";
      providerParcelId: number | null;
    }
  | {
      outcome: "reuse_provider";
      providerParcelId: number;
    }
  | {
      outcome: "in_flight";
    };
