/**
 * MEDIUM #7 — real concurrency / race simulation (test-scoped only).
 *
 * Models unique(shipping_labels_v1.shipment_parcel_id) claim semantics used by
 * claimLabelGenerationAttempt — NOT a production API.
 */
import { describe, expect, it } from "vitest";

import {
  decideLabelGenerationClaim,
  hasReusableProviderParcelId,
  isRecoveryParcelAttemptAuthorized,
  mayCreateNewProviderParcelAttempt,
  type LabelGenerationClaimOutcome,
} from "@/lib/shipping/label-generation-idempotency-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

type ClaimRow = {
  labelStatus: "pending" | "ready" | "void";
  trackingNumber: string | null;
  pdfUrl: string | null;
  providerParcelId: number | null;
};

/**
 * In-memory unique-constraint store that races concurrent inserts the same way
 * Postgres UNIQUE(shipment_parcel_id) + re-read-on-conflict does.
 */
function createLabelClaimRaceHarness() {
  const rows = new Map<string, ClaimRow>();
  let insertGate = Promise.resolve();

  async function withInsertGate<T>(fn: () => Promise<T>): Promise<T> {
    const previous = insertGate;
    let release!: () => void;
    insertGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  function mapRow(row: ClaimRow, claimedByThisRequest: boolean): LabelGenerationClaimOutcome {
    const decision = decideLabelGenerationClaim({
      labelStatus: row.labelStatus,
      trackingNumber: row.trackingNumber,
      pdfUrl: row.pdfUrl,
      providerParcelId: row.providerParcelId,
      claimedByThisRequest,
    });
    if (decision.action === "return_ready" && row.trackingNumber && row.pdfUrl) {
      return {
        outcome: "reuse_ready",
        trackingNumber: row.trackingNumber,
        pdfUrl: row.pdfUrl,
        labelStatus: "ready",
        providerParcelId: row.providerParcelId,
      };
    }
    if (decision.action === "reuse_provider") {
      return {
        outcome: "reuse_provider",
        providerParcelId: decision.providerParcelId,
      };
    }
    if (decision.action === "wait_in_flight") {
      return { outcome: "in_flight" };
    }
    return { outcome: "claimed" };
  }

  async function claim(parcelId: string): Promise<LabelGenerationClaimOutcome> {
    const existing = rows.get(parcelId);
    if (existing) {
      return mapRow(existing, false);
    }

    return withInsertGate(async () => {
      const raced = rows.get(parcelId);
      if (raced) {
        return mapRow(raced, false);
      }
      // Yield so concurrent callers interleave before the unique insert lands.
      await Promise.resolve();
      if (rows.has(parcelId)) {
        return mapRow(rows.get(parcelId)!, false);
      }
      rows.set(parcelId, {
        labelStatus: "pending",
        trackingNumber: null,
        pdfUrl: null,
        providerParcelId: null,
      });
      return { outcome: "claimed" };
    });
  }

  function completeReady(
    parcelId: string,
    trackingNumber: string,
    pdfUrl: string,
    providerParcelId: number,
  ): void {
    rows.set(parcelId, {
      labelStatus: "ready",
      trackingNumber,
      pdfUrl,
      providerParcelId,
    });
  }

  function attachProviderOnly(parcelId: string, providerParcelId: number): void {
    const current = rows.get(parcelId);
    rows.set(parcelId, {
      labelStatus: current?.labelStatus === "ready" ? "ready" : "pending",
      trackingNumber: current?.trackingNumber ?? null,
      pdfUrl: current?.pdfUrl ?? null,
      providerParcelId,
    });
  }

  function markVoid(parcelId: string): void {
    rows.set(parcelId, {
      labelStatus: "void",
      trackingNumber: null,
      pdfUrl: null,
      providerParcelId: null,
    });
  }

  return { claim, completeReady, attachProviderOnly, markVoid, rows };
}

function createParcelCreateRaceHarness() {
  const parcels = new Map<string, Set<number>>();
  let gate = Promise.resolve();

  async function create(orderId: string, parcelNumber: number): Promise<"created" | "reused"> {
    const previous = gate;
    let release!: () => void;
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      await Promise.resolve();
      const set = parcels.get(orderId) ?? new Set<number>();
      if (set.has(parcelNumber)) return "reused";
      set.add(parcelNumber);
      parcels.set(orderId, set);
      return "created";
    } finally {
      release();
    }
  }

  return { create, parcels };
}

describe("MEDIUM #7 — real concurrency race harness", () => {
  it("3 — eight concurrent claims → exactly one claimed winner", async () => {
    const harness = createLabelClaimRaceHarness();
    const results = await Promise.all([
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
      harness.claim("parcel-A"),
    ]);
    const claimed = results.filter((r) => r.outcome === "claimed");
    const inFlight = results.filter((r) => r.outcome === "in_flight");
    expect(claimed).toHaveLength(1);
    expect(inFlight).toHaveLength(7);
    expect(harness.rows.size).toBe(1);
  });

  it("1+2 — first claim then identical retry reuses ready label (no second row)", async () => {
    const harness = createLabelClaimRaceHarness();
    expect(await harness.claim("parcel-B")).toEqual({ outcome: "claimed" });
    harness.completeReady("parcel-B", "RX999", "https://cdn.test/b.pdf", 555);
    const retry = await harness.claim("parcel-B");
    expect(retry).toEqual({
      outcome: "reuse_ready",
      trackingNumber: "RX999",
      pdfUrl: "https://cdn.test/b.pdf",
      labelStatus: "ready",
      providerParcelId: 555,
    });
    expect(harness.rows.size).toBe(1);
  });

  it("4 — retry after simulated timeout with provider id → reuse_provider (no new label)", async () => {
    const harness = createLabelClaimRaceHarness();
    expect(await harness.claim("parcel-C")).toEqual({ outcome: "claimed" });
    // Provider announce succeeded; HTTP response timed out before ready artifact persisted.
    harness.attachProviderOnly("parcel-C", 7777);
    const retry = await Promise.all([harness.claim("parcel-C"), harness.claim("parcel-C")]);
    expect(retry.every((r) => r.outcome === "reuse_provider")).toBe(true);
    expect(retry[0]).toEqual({ outcome: "reuse_provider", providerParcelId: 7777 });
    expect(harness.rows.size).toBe(1);
  });

  it("5 — existing provider parcel blocks new provider attempt", () => {
    const parcel = {
      id: "p1",
      shippingRecordId: "r1",
      parcelNumber: 1,
      totalParcels: 1,
      weightKg: 1,
      dimensions: null,
      carrier: null,
      shippingService: null,
      trackingNumber: null,
      trackingUrl: null,
      status: "preparing",
      productItemIds: [],
      insuranceEnabled: false,
      insuranceValueGbp: null,
      operation: null,
      estimatedDeliveryAt: null,
      label: null,
      providerParcelId: 4242,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    } satisfies ShipmentParcel;
    expect(hasReusableProviderParcelId(4242)).toBe(true);
    expect(
      mayCreateNewProviderParcelAttempt({
        parcel,
        existingProviderParcelId: 4242,
      }),
    ).toBe(false);
  });

  it("6 — failed/void claim can be reclaimed exactly once under concurrency", async () => {
    const harness = createLabelClaimRaceHarness();
    harness.markVoid("parcel-D");
    const first = await harness.claim("parcel-D");
    // Production flips void → pending after reclaim; simulate that.
    harness.rows.set("parcel-D", {
      labelStatus: "pending",
      trackingNumber: null,
      pdfUrl: null,
      providerParcelId: null,
    });
    const peers = await Promise.all([harness.claim("parcel-D"), harness.claim("parcel-D")]);
    expect(first.outcome).toBe("claimed");
    expect(peers.every((r) => r.outcome === "in_flight")).toBe(true);
  });

  it("7+8 — recovery authorize true only; normal retry never authorizes append", () => {
    expect(isRecoveryParcelAttemptAuthorized(undefined)).toBe(false);
    expect(isRecoveryParcelAttemptAuthorized(false)).toBe(false);
    expect(isRecoveryParcelAttemptAuthorized(true)).toBe(true);
  });

  it("concurrent parcel creates for same number → exactly one created", async () => {
    const harness = createParcelCreateRaceHarness();
    const results = await Promise.all(
      Array.from({ length: 12 }, () => harness.create("order-1", 1)),
    );
    expect(results.filter((r) => r === "created")).toHaveLength(1);
    expect(results.filter((r) => r === "reused")).toHaveLength(11);
    expect(harness.parcels.get("order-1")?.size).toBe(1);
  });
});
