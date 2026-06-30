import { createAdminClient } from "@/lib/supabase/admin";
import {
  getProtectionCase,
  listProtectionCaseEvents,
  listProtectionCasesForUser,
} from "@/lib/protection/service";
import type { ProtectionCase } from "@/lib/protection/service";
import { readLiveProtectionEngineDocument, getProtectionEngineSnapshotForAdmin } from "@/lib/protection-engine/engine";
import { MAX_PROTECTION_FEE, MIN_PROTECTION_FEE, PROTECTION_FEE_RATE } from "@/lib/protection-engine/defaults";
import { PROTECTION_ENGINE_MODULES } from "@/lib/protection-engine/registry";
import {
  buildCaseTimeline,
  deriveProtectionPhase,
  mapCaseToSummary,
  matchesSearch,
  matchesSummaryFilter,
} from "@/lib/protection-engine/timeline";
import type {
  ProtectionEngineAnalytics,
  ProtectionEngineCaseContext,
  ProtectionEngineContext,
  ProtectionEngineFilterId,
  ProtectionEngineSnapshot,
  ProtectionEngineCaseSummary,
} from "@/lib/protection-engine/types";

export async function getPublicProtectionEngineConfig() {
  return readLiveProtectionEngineDocument();
}

export async function getProtectionEngineSnapshot(): Promise<ProtectionEngineSnapshot> {
  const { draft, live, history } = await getProtectionEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: PROTECTION_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

function mergeUserCases(userId: string, buyerCases: ProtectionCase[], sellerCases: ProtectionCase[]): ProtectionEngineCaseSummary[] {
  const buyerSummaries = buyerCases.map((c) => mapCaseToSummary(c, "buyer"));
  const sellerSummaries = sellerCases.map((c) => mapCaseToSummary(c, "seller"));
  return [...buyerSummaries, ...sellerSummaries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getProtectionEngineContext(userId: string): Promise<ProtectionEngineContext> {
  const [buyerCases, sellerCases] = await Promise.all([
    listProtectionCasesForUser(userId, "buyer"),
    listProtectionCasesForUser(userId, "seller"),
  ]);

  const allCases = [...buyerCases, ...sellerCases];
  const openCases = allCases.filter((c) => !["resolved", "closed"].includes(c.status));
  const appealedCases = allCases.filter((c) => c.status === "appealed");
  const summaries = mergeUserCases(userId, buyerCases, sellerCases);

  return {
    protectionPhase: deriveProtectionPhase(openCases.length, appealedCases.length),
    buyerCaseCount: buyerCases.length,
    sellerCaseCount: sellerCases.length,
    openCaseCount: openCases.length,
    minProtectionFee: MIN_PROTECTION_FEE,
    maxProtectionFee: MAX_PROTECTION_FEE,
    protectionRate: PROTECTION_FEE_RATE,
    recentCases: summaries.slice(0, 5),
  };
}

async function countCaseEvidence(caseId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("protection_evidence")
    .select("*", { count: "exact", head: true })
    .eq("case_id", caseId);
  return count ?? 0;
}

export async function getProtectionEngineCaseContext(caseId: string): Promise<ProtectionEngineCaseContext | null> {
  const [caseRecord, config] = await Promise.all([
    getProtectionCase(caseId),
    readLiveProtectionEngineDocument(),
  ]);
  if (!caseRecord) return null;

  const [events, evidenceCount] = await Promise.all([
    listProtectionCaseEvents(caseId),
    countCaseEvidence(caseId),
  ]);

  const role: "buyer" | "seller" = "buyer";
  const summary = mapCaseToSummary(caseRecord, role);
  const timeline = buildCaseTimeline(caseRecord, events);

  return {
    summary,
    timeline,
    evidenceCount,
    ordersIntegrated: config.integrations.ordersEngine,
    shippingIntegrated: config.integrations.shippingEngine,
    walletIntegrated: config.integrations.walletEngine,
    paymentsIntegrated: config.integrations.paymentsEngine,
  };
}

export async function listProtectionEngineSummaries(
  userId: string,
  options?: { filter?: ProtectionEngineFilterId; query?: string },
): Promise<ProtectionEngineCaseSummary[]> {
  const [buyerCases, sellerCases] = await Promise.all([
    listProtectionCasesForUser(userId, "buyer"),
    listProtectionCasesForUser(userId, "seller"),
  ]);

  return mergeUserCases(userId, buyerCases, sellerCases)
    .filter((summary) =>
      options?.filter ? matchesSummaryFilter(summary.enterpriseStatus, options.filter) : true,
    )
    .filter((summary) =>
      options?.query
        ? matchesSearch(options.query, {
            reason: summary.reason,
            caseType: summary.caseType,
            orderId: summary.orderId,
          })
        : true,
    );
}

export function computeProtectionAnalytics(cases: ProtectionCase[]): ProtectionEngineAnalytics {
  const openCases = cases.filter((c) => !["resolved", "closed"].includes(c.status));
  const closedCases = cases.filter((c) => ["resolved", "closed"].includes(c.status));
  const refundCases = cases.filter((c) => c.outcome === "refund_full" || c.outcome === "refund_partial");
  const partialRefunds = cases.filter((c) => c.outcome === "refund_partial");

  const refundValue = refundCases.reduce((sum, c) => sum + (c.refundAmount ?? 0), 0);

  const resolvedWithDates = cases.filter((c) => c.resolvedAt);
  const avgDays =
    resolvedWithDates.length > 0
      ? resolvedWithDates.reduce((sum, c) => {
          const days = (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / resolvedWithDates.length
      : 0;

  const buyerWins = cases.filter((c) => c.outcome === "buyer_favour" || c.outcome === "refund_full").length;

  return {
    openCases: openCases.length,
    closedCases: closedCases.length,
    refundValue,
    partialRefunds: partialRefunds.length,
    averageResolutionDays: Math.round(avgDays * 10) / 10,
    buyerSatisfaction: closedCases.length ? buyerWins / closedCases.length : 0,
    sellerPerformance: closedCases.length ? 1 - buyerWins / closedCases.length : 1,
    protectionCost: refundValue,
    disputeRate: cases.length ? openCases.length / cases.length : 0,
  };
}

export async function getProtectionEngineAnalyticsForUser(userId: string): Promise<ProtectionEngineAnalytics> {
  const [buyerCases, sellerCases] = await Promise.all([
    listProtectionCasesForUser(userId, "buyer"),
    listProtectionCasesForUser(userId, "seller"),
  ]);
  const unique = new Map<string, ProtectionCase>();
  for (const c of [...buyerCases, ...sellerCases]) unique.set(c.id, c);
  return computeProtectionAnalytics([...unique.values()]);
}
