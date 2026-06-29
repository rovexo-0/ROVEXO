import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import {
  ENTERPRISE_COMPLIANCE_CENTER_DRAFT_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_HISTORY_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_LIVE_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY,
} from "@/lib/enterprise-compliance-center-engine/keys";
import { ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-compliance-center-engine/descriptor";
import { createDefaultEnterpriseComplianceSettings } from "@/lib/enterprise-compliance-center-engine/engine";
import type { EnterpriseComplianceSettings } from "@/lib/enterprise-compliance-center-engine/types";
import type {
  EnterpriseConfigDocument,
  EnterpriseConfigHistoryEntry,
} from "@/lib/enterprise-architecture/types";

export type EnterpriseComplianceFeatureFlags = Record<
  (typeof ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type EnterpriseComplianceConfigDocument = EnterpriseConfigDocument<
  EnterpriseComplianceSettings,
  EnterpriseComplianceFeatureFlags
>;

export type EnterpriseComplianceConfigHistoryEntry = EnterpriseConfigHistoryEntry<EnterpriseComplianceConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): EnterpriseComplianceConfigDocument {
  return {
    label,
    version: "2.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.featureFlags,
    ) as EnterpriseComplianceFeatureFlags,
    settings: createDefaultEnterpriseComplianceSettings(),
    auditLog: [],
  };
}

function normalizeDocument(doc: EnterpriseComplianceConfigDocument): EnterpriseComplianceConfigDocument {
  return {
    ...createDefaultDocument(doc.label),
    ...doc,
    settings: { ...createDefaultEnterpriseComplianceSettings(), ...doc.settings },
    featureFlags: mergeFeatureFlags(
      ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as EnterpriseComplianceFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const enterpriseComplianceConfigLifecycle = createConfigLifecycle<
  EnterpriseComplianceSettings,
  EnterpriseComplianceFeatureFlags,
  EnterpriseComplianceConfigHistoryEntry
>({
  moduleId: ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_COMPLIANCE_CENTER_DRAFT_KEY,
  liveKey: ENTERPRISE_COMPLIANCE_CENTER_LIVE_KEY,
  historyKey: ENTERPRISE_COMPLIANCE_CENTER_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `ecc-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      actorId: input.actorId,
      moduleId: ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function syncEnterpriseComplianceSettingsFromLive(actorId: string): Promise<void> {
  const live = await enterpriseComplianceConfigLifecycle.readLive();
  const { updatePlatformSetting } = await import("@/lib/super-admin/settings");
  await updatePlatformSetting({
    actorId,
    key: ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY,
    value: live.settings,
  });
}

export { ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY };
