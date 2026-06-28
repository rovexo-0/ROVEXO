import type { HomepageBuilderTab, HomepageBuilderSnapshot } from "@/lib/homepage-builder-engine/types";
import { generateHomepageAiSuggestions, optimizeLayoutScore } from "@/lib/homepage-builder-engine/ai";
import { buildAssetReferences } from "@/lib/homepage-builder-engine/assets";
import {
  detectHomepagePendingPublish,
  getHomepageBuilderDraftDocument,
  getHomepageBuilderLiveDocument,
  homepageBuilderConfigLifecycle,
} from "@/lib/homepage-builder-engine/config";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";
import { buildHomepageDashboard } from "@/lib/homepage-builder-engine/engine";
import { validateHomepageDocument } from "@/lib/homepage-builder-engine/publish";
import { createVersionEntry } from "@/lib/homepage-builder-engine/versioning";

export async function getHomepageBuilderSnapshot(tab: HomepageBuilderTab = "dashboard"): Promise<HomepageBuilderSnapshot> {
  const live = await getHomepageBuilderLiveDocument();
  const draft = await getHomepageBuilderDraftDocument();
  const { production, draft: draftDoc, schedules, ...settingsRest } = live.settings;
  const flags = live.featureFlags;
  const validation = validateHomepageDocument(draftDoc);
  const history = await homepageBuilderConfigLifecycle.getHistory();
  const versionEntries = history.map((h) =>
    createVersionEntry(h.bundle.settings.production, h.publishedBy, `Published ${h.publishedAt}`),
  );

  const enabled = flags.homepage_builder_enabled !== false;
  const healthScore = enabled ? Math.round((validation.score + optimizeLayoutScore(draftDoc.sections)) / 2) : 0;

  return {
    tab,
    dashboard: buildHomepageDashboard(production, draftDoc, schedules, versionEntries.length, validation.score),
    production,
    draft: draftDoc,
    scheduled: schedules.find((s) => s.status === "scheduled"),
    previewMode: "desktop",
    history: versionEntries,
    schedules,
    componentLibrary: draftDoc.components,
    aiSuggestions: flags.ai_assistant_enabled !== false ? generateHomepageAiSuggestions(draftDoc.sections) : [],
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlags: flags,
    pendingPublish: detectHomepagePendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Homepage builder operational" : "Homepage builder disabled",
    },
    integrations: {
      assetManager: settingsRest.assetManagerIntegration && flags.asset_integration_enabled !== false,
      visualCms: settingsRest.visualCmsIntegration,
      workflowEngine: true,
    },
  };
}

export async function getHomepageBuilderPageData(tab: HomepageBuilderTab = "dashboard") {
  const snapshot = await getHomepageBuilderSnapshot(tab);
  return { snapshot, descriptor: HOMEPAGE_BUILDER_MODULE_DESCRIPTOR, assets: buildAssetReferences(snapshot.integrations.assetManager) };
}

export function validateHomepageBuilderReadiness(snapshot: HomepageBuilderSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlags.homepage_builder_enabled !== false,
    snapshot.draft.sections.length > 0,
    snapshot.health.score >= 50,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
