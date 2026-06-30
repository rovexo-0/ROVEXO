import {
  createConfigLifecycle,
  createDefaultFeatureFlags,
  createEnterpriseConfigAuditEntry,
  mergeFeatureFlags,
  traceEnterpriseModuleAction,
} from "@/lib/enterprise-architecture";
import type { EnterpriseConfigDocument, EnterpriseConfigHistoryEntry } from "@/lib/enterprise-architecture/types";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";
import {
  createDefaultDeploymentSettings,
  createDefaultDeploymentState,
} from "@/lib/enterprise-deployment-center/engine";
import {
  ENTERPRISE_DEPLOYMENT_DRAFT_KEY,
  ENTERPRISE_DEPLOYMENT_HISTORY_KEY,
  ENTERPRISE_DEPLOYMENT_LIVE_KEY,
} from "@/lib/enterprise-deployment-center/keys";
import type { DeploymentSettings, DeploymentState } from "@/lib/enterprise-deployment-center/types";

export type DeploymentFeatureFlags = Record<
  (typeof ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.featureFlags)[number]["id"],
  boolean
>;

export type DeploymentConfigDocument = EnterpriseConfigDocument<
  DeploymentSettings & DeploymentState,
  DeploymentFeatureFlags
>;

export type DeploymentConfigHistoryEntry = EnterpriseConfigHistoryEntry<DeploymentConfigDocument>;

function createDefaultDocument(label: "Draft" | "Live"): DeploymentConfigDocument {
  const state = createDefaultDeploymentState();
  return {
    label,
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    featureFlags: createDefaultFeatureFlags(
      ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.featureFlags,
    ) as DeploymentFeatureFlags,
    settings: { ...createDefaultDeploymentSettings(), ...state },
    auditLog: [],
  };
}

function normalizeDocument(doc: DeploymentConfigDocument): DeploymentConfigDocument {
  const defaults = createDefaultDocument(doc.label);
  const defaultState = createDefaultDeploymentState();
  return {
    ...defaults,
    ...doc,
    settings: {
      ...defaults.settings,
      ...doc.settings,
      environments: doc.settings?.environments ?? defaultState.environments,
      releases: doc.settings?.releases ?? defaultState.releases,
      builds: doc.settings?.builds ?? defaultState.builds,
      queue: doc.settings?.queue ?? defaultState.queue,
      featureFlags: doc.settings?.featureFlags ?? defaultState.featureFlags,
      releaseNotes: doc.settings?.releaseNotes ?? defaultState.releaseNotes,
      aiInsights: doc.settings?.aiInsights ?? defaultState.aiInsights,
      deploymentHistory: doc.settings?.deploymentHistory ?? defaultState.deploymentHistory,
    },
    featureFlags: mergeFeatureFlags(
      ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR,
      doc.featureFlags,
    ) as DeploymentFeatureFlags,
    auditLog: doc.auditLog ?? [],
  };
}

export const deploymentConfigLifecycle = createConfigLifecycle<
  DeploymentSettings & DeploymentState,
  DeploymentFeatureFlags,
  DeploymentConfigHistoryEntry
>({
  moduleId: ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id,
  draftKey: ENTERPRISE_DEPLOYMENT_DRAFT_KEY,
  liveKey: ENTERPRISE_DEPLOYMENT_LIVE_KEY,
  historyKey: ENTERPRISE_DEPLOYMENT_HISTORY_KEY,
  createDefault: createDefaultDocument,
  normalize: normalizeDocument,
  createHistoryEntry: (live, actorId) => ({
    id: `dep-cfg-${Date.now()}`,
    publishedAt: new Date().toISOString(),
    publishedBy: actorId,
    label: live.label,
    bundle: live,
    rollbackAvailable: true,
  }),
  audit: (input) =>
    traceEnterpriseModuleAction({
      moduleId: ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id,
      action: input.action,
      actorId: input.actorId,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
  createAuditEntry: (input) =>
    createEnterpriseConfigAuditEntry({
      administrator: input.administrator,
      module: ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
    }),
});

export async function getDeploymentLiveDocument(): Promise<DeploymentConfigDocument> {
  return deploymentConfigLifecycle.readLive();
}

export async function getDeploymentDraftDocument(): Promise<DeploymentConfigDocument> {
  return deploymentConfigLifecycle.getDraft();
}

export function detectDeploymentPendingPublish(draft: DeploymentConfigDocument, live: DeploymentConfigDocument): boolean {
  return JSON.stringify(draft.settings) !== JSON.stringify(live.settings);
}
