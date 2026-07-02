import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";
import {
  createDefaultHomepageBuilderSettings,
  createDefaultHomepageDocument,
  createDefaultSchedules,
} from "@/lib/homepage-builder-engine/engine";
import {
  HOMEPAGE_BUILDER_ENGINE_DRAFT_KEY,
  HOMEPAGE_BUILDER_ENGINE_HISTORY_KEY,
  HOMEPAGE_BUILDER_ENGINE_LIVE_KEY,
} from "@/lib/homepage-builder-engine/keys";
import type { HomepageBuilderDocument, HomepageBuilderSettings, HomepageScheduleEntry } from "@/lib/homepage-builder-engine/types";

export type HomepageBuilderFeatureFlags = Record<
  (typeof HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type HomepageBuilderSettingsState = HomepageBuilderSettings & {
  production: HomepageBuilderDocument;
  draft: HomepageBuilderDocument;
  schedules: HomepageScheduleEntry[];
};

export type HomepageBuilderConfigDocument = EnterpriseConfigDocument<
  HomepageBuilderSettingsState,
  HomepageBuilderFeatureFlags
>;

export type HomepageBuilderConfigHistoryEntry = EnterpriseConfigHistoryEntry<HomepageBuilderConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): HomepageBuilderConfigDocument {
  const production = createDefaultHomepageDocument("Live");
  const draft = createDefaultHomepageDocument("Draft");
  return {
    label,
    version: "2.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.featureFlags,
    ) as HomepageBuilderFeatureFlags,
    settings: {
      ...createDefaultHomepageBuilderSettings(),
      production,
      draft,
      schedules: createDefaultSchedules(),
    },
    auditLog: [],
  };
}

function normalizeDocument(doc: HomepageBuilderConfigDocument): HomepageBuilderConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      production: doc.settings?.production ?? defaults.settings.production,
      draft: doc.settings?.draft ?? defaults.settings.draft,
      schedules: doc.settings?.schedules ?? defaults.settings.schedules,
    },
    featureFlags: mergeFeatureFlags(
      HOMEPAGE_BUILDER_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as HomepageBuilderFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const homepageBuilderConfigLifecycle = createConfigLifecycle<
  HomepageBuilderSettingsState,
  HomepageBuilderFeatureFlags,
  HomepageBuilderConfigHistoryEntry
>({
  moduleId: HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.id,
  draftKey: HOMEPAGE_BUILDER_ENGINE_DRAFT_KEY,
  liveKey: HOMEPAGE_BUILDER_ENGINE_LIVE_KEY,
  historyKey: HOMEPAGE_BUILDER_ENGINE_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `hpb-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getHomepageBuilderLiveDocument(): Promise<HomepageBuilderConfigDocument> {
  return homepageBuilderConfigLifecycle.readLive();
}

export async function getHomepageBuilderDraftDocument(): Promise<HomepageBuilderConfigDocument> {
  return homepageBuilderConfigLifecycle.getDraft();
}

export function detectHomepagePendingPublish(
  draft: HomepageBuilderConfigDocument,
  live: HomepageBuilderConfigDocument,
): boolean {
  return JSON.stringify(draft.settings.draft) !== JSON.stringify(live.settings.production);
}
