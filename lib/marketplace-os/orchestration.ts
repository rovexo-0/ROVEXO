import { revalidatePath } from "next/cache";
import { runOrganicGrowthAutomation } from "@/lib/organic-growth/automation";
import { runOrganicGrowthOptimization } from "@/lib/seo/engine/optimizer";
import { runMarketplaceIntelligenceAutomation } from "@/lib/marketplace-intelligence/automation";
import { detectMarketplaceOpportunities } from "@/lib/marketplace-intelligence/opportunity";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import { executeRules } from "@/lib/marketplace-os/rules";
import { validateRulesFailsafe, guardOrchestration, detectDependencyCycle } from "@/lib/marketplace-os/failsafe";
import { evaluateMarketplaceState, marketplaceStateToRuleContext } from "@/lib/marketplace-os/state";
import { assignMarketplacePriorities } from "@/lib/marketplace-os/priority";
import { evaluateMarketplaceBalance } from "@/lib/marketplace-os/balance";
import { detectMarketplaceEvents } from "@/lib/marketplace-os/events";
import { orchestrateHomepage } from "@/lib/marketplace-os/homepage-orchestrator";
import { orchestrateDiscovery } from "@/lib/marketplace-os/discovery-orchestrator";
import { orchestrateSearch } from "@/lib/marketplace-os/search-orchestrator";
import { generateMarketplaceAlerts } from "@/lib/marketplace-os/alerts";
import { auditRuleExecutions, appendAuditEntries } from "@/lib/marketplace-os/audit";
import type { MosDocument, OrchestrationResult, MosSubsystemId } from "@/lib/marketplace-os/types";

/**
 * Orchestration Engine — central MOS coordinator.
 * Orchestrates subsystems without replacing them.
 */
export async function runMarketplaceOrchestration(document: MosDocument): Promise<OrchestrationResult> {
  const thresholds = document.thresholds;
  const subsystemsCoordinated: MosSubsystemId[] = [];

  const failsafeIssues = validateRulesFailsafe(document.rules);
  if (document.failsafeEnabled && failsafeIssues.some((issue) => issue.type === "cycle")) {
    return {
      executedAt: new Date().toISOString(),
      subsystemsCoordinated: [],
      homepageUpdated: false,
      discoveryUpdated: false,
      searchUpdated: false,
      seoUpdated: false,
      intelligenceUpdated: false,
      organicGrowthUpdated: false,
      surfacesRevalidated: [],
      rulesExecuted: 0,
      eventsDetected: 0,
      alertsGenerated: 0,
      auditEntries: 0,
      status: "blocked",
    };
  }

  if (document.failsafeEnabled && detectDependencyCycle(document.rules)) {
    return {
      executedAt: new Date().toISOString(),
      subsystemsCoordinated: [],
      homepageUpdated: false,
      discoveryUpdated: false,
      searchUpdated: false,
      seoUpdated: false,
      intelligenceUpdated: false,
      organicGrowthUpdated: false,
      surfacesRevalidated: [],
      rulesExecuted: 0,
      eventsDetected: 0,
      alertsGenerated: 0,
      auditEntries: 0,
      status: "blocked",
    };
  }

  const state = await evaluateMarketplaceState(thresholds);
  const context = marketplaceStateToRuleContext(state);
  const ruleResults = executeRules(document.rules, context);
  const guard = guardOrchestration(ruleResults);
  if (!guard.allowed) {
    return {
      executedAt: new Date().toISOString(),
      subsystemsCoordinated: [],
      homepageUpdated: false,
      discoveryUpdated: false,
      searchUpdated: false,
      seoUpdated: false,
      intelligenceUpdated: false,
      organicGrowthUpdated: false,
      surfacesRevalidated: [],
      rulesExecuted: ruleResults.length,
      eventsDetected: 0,
      alertsGenerated: 0,
      auditEntries: 0,
      status: "blocked",
    };
  }

  const intelThresholds = { ...DEFAULT_THRESHOLDS, minInventory: thresholds.minInventory };

  const [priorities, balance, events, organic, seo, intelligence] = await Promise.all([
    assignMarketplacePriorities(thresholds),
    evaluateMarketplaceBalance(thresholds),
    detectMarketplaceEvents(state, thresholds),
    runOrganicGrowthAutomation(),
    runOrganicGrowthOptimization(),
    runMarketplaceIntelligenceAutomation(intelThresholds),
    detectMarketplaceOpportunities(intelThresholds),
  ]);

  subsystemsCoordinated.push("organic-growth", "seo", "marketplace-intelligence");

  await Promise.all([
    orchestrateHomepage(priorities, thresholds),
    orchestrateDiscovery(priorities, thresholds),
    orchestrateSearch(priorities, thresholds),
  ]);

  subsystemsCoordinated.push("homepage", "search");

  const alerts = await generateMarketplaceAlerts({ state, events, balance, thresholds });
  subsystemsCoordinated.push("analytics", "notifications");

  const surfacesRevalidated: string[] = [];
  if (document.automationEnabled) {
    try {
      revalidatePath("/");
      revalidatePath("/categories");
      revalidatePath("/search");
      revalidatePath("/collections/[slug]", "page");
      revalidatePath("/discover/[slug]", "page");
      revalidatePath("/trends/[slug]", "page");
      surfacesRevalidated.push("/", "/categories", "/search", "/collections", "/discover", "/trends");
    } catch {
      // Outside request context in tests
    }
  }

  let auditEntries = 0;
  if (document.auditEnabled) {
    const entries = auditRuleExecutions(ruleResults, context, state.status);
    appendAuditEntries(entries);
    auditEntries = entries.length;
  }

  return {
    executedAt: new Date().toISOString(),
    subsystemsCoordinated: [...new Set(subsystemsCoordinated)],
    homepageUpdated: organic.discoveryUpdated > 0,
    discoveryUpdated: organic.discoveryUpdated > 0,
    searchUpdated: true,
    seoUpdated: seo.evaluatedAt.length > 0,
    intelligenceUpdated: intelligence.status === "completed",
    organicGrowthUpdated: organic.status === "completed",
    surfacesRevalidated,
    rulesExecuted: ruleResults.filter((result) => result.matched).length,
    eventsDetected: events.length,
    alertsGenerated: alerts.length,
    auditEntries,
    status: "completed",
  };
}
