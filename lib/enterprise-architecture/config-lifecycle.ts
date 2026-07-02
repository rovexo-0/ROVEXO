import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import type {
  EnterpriseConfigAuditEntry,
  EnterpriseConfigDocument,
  EnterpriseConfigHistoryEntry,
} from "@/lib/enterprise-architecture/types";

export type ConfigLifecycleOptions<
  TSettings,
  TFeatureFlags extends Record<string, boolean>,
  THistory extends EnterpriseConfigHistoryEntry<EnterpriseConfigDocument<TSettings, TFeatureFlags>>,
> = {
  moduleId: string;
  draftKey: string;
  liveKey: string;
  historyKey: string;
  createDefault: (label: "Draft" | "Live") => EnterpriseConfigDocument<TSettings, TFeatureFlags>;
  normalize: (doc: EnterpriseConfigDocument<TSettings, TFeatureFlags>) => EnterpriseConfigDocument<TSettings, TFeatureFlags>;
  createHistoryEntry: (
    live: EnterpriseConfigDocument<TSettings, TFeatureFlags>,
    actorId: string,
  ) => THistory;
  audit: (input: {
    actorId: string;
    action: string;
    previousValue?: unknown;
    newValue?: unknown;
  }) => Promise<void>;
  createAuditEntry: (input: {
    administrator: string;
    action: string;
    previousValue?: unknown;
    newValue?: unknown;
  }) => EnterpriseConfigAuditEntry;
  defaultHistory?: THistory[];
  historyLimit?: number;
};

export function createConfigLifecycle<
  TSettings,
  TFeatureFlags extends Record<string, boolean>,
  THistory extends EnterpriseConfigHistoryEntry<EnterpriseConfigDocument<TSettings, TFeatureFlags>>,
>(options: ConfigLifecycleOptions<TSettings, TFeatureFlags, THistory>) {
  const historyLimit = options.historyLimit ?? 20;

  async function readLive(): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    const doc = await getPlatformSetting(options.liveKey, () => options.createDefault("Live"));
    return options.normalize(doc);
  }

  async function getDraft(): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    const live = await readLive();
    const draft = await getPlatformSetting(options.draftKey, live);
    return options.normalize({
      ...draft,
      label: draft.label === "Live" ? "Draft" : draft.label,
    });
  }

  async function getHistory(): Promise<THistory[]> {
    return getPlatformSetting(options.historyKey, options.defaultHistory ?? []);
  }

  async function getConfigSnapshot() {
    const [draft, live, history] = await Promise.all([getDraft(), readLive(), getHistory()]);
    return { draft, live, history };
  }

  async function saveDraft(
    document: EnterpriseConfigDocument<TSettings, TFeatureFlags>,
    actorId: string,
  ): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    const next = options.normalize({
      ...document,
      label: "Draft",
      updatedAt: new Date().toISOString(),
      auditLog: [
        options.createAuditEntry({
          administrator: actorId,
          action: "save-draft",
          newValue: { version: document.version },
        }),
        ...document.auditLog,
      ].slice(0, 100),
    });

    await updatePlatformSetting({ actorId, key: options.draftKey, value: next as unknown as Json });
    await options.audit({ actorId, action: "save-draft", newValue: { version: next.version } });
    return next;
  }

  async function publish(actorId: string): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    const [draft, live, history] = await Promise.all([getDraft(), readLive(), getHistory()]);
    const historyEntry = options.createHistoryEntry(live, actorId);

    const published = options.normalize({
      ...draft,
      label: "Live",
      updatedAt: new Date().toISOString(),
      auditLog: [
        options.createAuditEntry({
          administrator: actorId,
          action: "publish",
          previousValue: { version: live.version },
          newValue: { version: draft.version },
        }),
        ...draft.auditLog,
      ].slice(0, 100),
    });

    await Promise.all([
      updatePlatformSetting({ actorId, key: options.liveKey, value: published as unknown as Json }),
      updatePlatformSetting({
        actorId,
        key: options.draftKey,
        value: { ...published, label: "Draft" } as unknown as Json,
      }),
      updatePlatformSetting({
        actorId,
        key: options.historyKey,
        value: [historyEntry, ...history].slice(0, historyLimit) as unknown as Json,
      }),
    ]);

    await options.audit({
      actorId,
      action: "publish",
      previousValue: { version: live.version },
      newValue: { version: published.version },
    });

    return published;
  }

  async function rollback(
    historyId: string,
    actorId: string,
  ): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    const history = await getHistory();
    const entry = history.find((item) => item.id === historyId && item.rollbackAvailable && item.bundle);
    if (!entry?.bundle) throw new Error(`${options.moduleId} rollback entry not found.`);

    const restored = options.normalize({
      ...entry.bundle,
      label: "Live",
      updatedAt: new Date().toISOString(),
    });

    await Promise.all([
      updatePlatformSetting({ actorId, key: options.liveKey, value: restored as unknown as Json }),
      updatePlatformSetting({
        actorId,
        key: options.draftKey,
        value: { ...restored, label: "Draft" } as unknown as Json,
      }),
    ]);

    await options.audit({
      actorId,
      action: "rollback",
      previousValue: { historyId },
      newValue: { version: restored.version },
    });

    return restored;
  }

  async function importDocument(
    document: EnterpriseConfigDocument<TSettings, TFeatureFlags>,
    actorId: string,
  ): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    await options.audit({ actorId, action: "import", newValue: { version: document.version } });
    return saveDraft(document, actorId);
  }

  async function exportDocument(): Promise<EnterpriseConfigDocument<TSettings, TFeatureFlags>> {
    return readLive();
  }

  return {
    readLive,
    getDraft,
    getHistory,
    getConfigSnapshot,
    saveDraft,
    publish,
    rollback,
    importDocument,
    exportDocument,
  };
}
