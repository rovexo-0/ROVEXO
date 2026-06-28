import type { SocSnapshot, SocTab } from "@/lib/enterprise-security-operations-center/types";
import { detectSocPendingPublish, getSocDraftDocument, getSocLiveDocument, socConfigLifecycle } from "@/lib/enterprise-security-operations-center/config";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";
import { buildSocDashboard, createDefaultSocSettings } from "@/lib/enterprise-security-operations-center/engine";
import { liveEvents } from "@/lib/enterprise-security-operations-center/events";
import { listComplianceFrameworks } from "@/lib/enterprise-security-operations-center/compliance";

export async function getSocSnapshot(tab: SocTab = "dashboard"): Promise<SocSnapshot> {
  const live = await getSocLiveDocument();
  const draft = await getSocDraftDocument();
  const {
    events,
    threats,
    intrusions,
    scannerResults,
    firewallRules,
    devices,
    sessions,
    vulnerabilities,
    aiInsights,
    automations,
    auditTimeline,
    ...settingsFields
  } = live.settings;
  const settings = { ...createDefaultSocSettings(), ...settingsFields };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_soc_v1 !== false;
  const state = { events, threats, intrusions, scannerResults, firewallRules, devices, sessions, vulnerabilities, aiInsights, automations, auditTimeline };
  const dashboard = buildSocDashboard(state, settings);
  const history = await socConfigLifecycle.getHistory();
  const healthScore = enabled ? dashboard.securityScore : 0;

  return {
    tab,
    dashboard,
    events,
    liveEvents: flags.live_monitoring_enabled !== false ? liveEvents(events) : [],
    threats: flags.firewall_enabled !== false ? threats : [],
    intrusions,
    scannerResults: flags.scanner_enabled !== false ? scannerResults : [],
    firewallRules: flags.firewall_enabled !== false ? firewallRules : [],
    devices,
    sessions,
    vulnerabilities,
    aiInsights: flags.ai_security_enabled !== false ? aiInsights : [],
    settings,
    complianceFrameworks: flags.compliance_enabled !== false ? listComplianceFrameworks() : [],
    history: history.map((h) => ({ id: h.id, action: "publish", actor: h.publishedBy, timestamp: h.publishedAt })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    auditTimeline,
    featureFlagsConfig: flags,
    pendingPublish: detectSocPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Security Operations Center operational" : "SOC disabled",
    },
  };
}

export async function getSocPageData(tab: SocTab = "dashboard") {
  const snapshot = await getSocSnapshot(tab);
  return { snapshot, descriptor: ENTERPRISE_SOC_MODULE_DESCRIPTOR };
}

export function validateSocReadiness(snapshot: SocSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_soc_v1 !== false,
    snapshot.firewallRules.length > 0,
    snapshot.health.score >= 50,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}
