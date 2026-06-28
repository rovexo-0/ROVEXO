import type {
  HomepageBuilderDocument,
  HomepageBuilderSettings,
  HomepageDashboardMetrics,
  HomepageScheduleEntry,
} from "@/lib/homepage-builder-engine/types";
import { createDefaultComponentLibrary } from "@/lib/homepage-builder-engine/components";
import { createDefaultHomepageSections } from "@/lib/homepage-builder-engine/sections";
import { detectPendingPublish } from "@/lib/homepage-builder-engine/versioning";

export function createDefaultHomepageBuilderSettings(): HomepageBuilderSettings {
  return {
    activeTheme: "ROVEXO Premium",
    autosaveEnabled: true,
    autosaveIntervalMs: 30_000,
    approvalRequired: true,
    aiAssistantEnabled: true,
    assetManagerIntegration: true,
    visualCmsIntegration: true,
  };
}

export function createDefaultHomepageDocument(label: HomepageBuilderDocument["label"] = "Draft"): HomepageBuilderDocument {
  const now = new Date().toISOString();
  return {
    id: "homepage-primary",
    label,
    version: "2.0.0",
    updatedAt: now,
    lastEditor: "system",
    sections: createDefaultHomepageSections(),
    components: createDefaultComponentLibrary(),
  };
}

export function createDefaultSchedules(): HomepageScheduleEntry[] {
  return [];
}

export function buildHomepageDashboard(
  production: HomepageBuilderDocument,
  draft: HomepageBuilderDocument,
  schedules: HomepageScheduleEntry[],
  historyCount: number,
  validationScore: number,
): HomepageDashboardMetrics {
  return {
    productionSections: production.sections.filter((s) => s.published).length,
    draftSections: draft.sections.length,
    scheduledHomepages: schedules.filter((s) => s.status === "scheduled").length,
    rollbackPoints: historyCount,
    publishingQueue: detectPendingPublish(draft, production) ? 1 : 0,
    healthScore: validationScore,
    recentChanges: draft.sections.filter((s) => !s.published).length,
  };
}

export function findSection(doc: HomepageBuilderDocument, sectionId: string) {
  return doc.sections.find((s) => s.id === sectionId);
}

export function upsertSection(doc: HomepageBuilderDocument, section: HomepageBuilderDocument["sections"][number]): HomepageBuilderDocument {
  const index = doc.sections.findIndex((s) => s.id === section.id);
  const sections =
    index >= 0
      ? doc.sections.map((s, i) => (i === index ? section : s))
      : [...doc.sections, section];
  return { ...doc, sections, updatedAt: new Date().toISOString() };
}
