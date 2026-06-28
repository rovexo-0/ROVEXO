import type { SocDashboard, SocSettings, SocState } from "@/lib/enterprise-security-operations-center/types";
import { createDefaultEvents, blockedEvents, computeThreatLevel, criticalEvents, liveEvents } from "@/lib/enterprise-security-operations-center/events";
import { createDefaultThreats } from "@/lib/enterprise-security-operations-center/threats";
import { activeIntrusions, createDefaultIntrusions } from "@/lib/enterprise-security-operations-center/intrusion";
import { createDefaultScannerResults, averageScanScore } from "@/lib/enterprise-security-operations-center/scanner";
import { createDefaultFirewallRules, firewallStatus } from "@/lib/enterprise-security-operations-center/firewall";
import { createDefaultDevices, createDefaultSessions, mfaCoverage, suspiciousSessions } from "@/lib/enterprise-security-operations-center/devices";
import { createDefaultVulnerabilities, openVulnerabilities, vulnerabilityRiskScore } from "@/lib/enterprise-security-operations-center/vulnerabilities";
import { generateSocAiInsights } from "@/lib/enterprise-security-operations-center/ai-integration";
import { createDefaultAutomations } from "@/lib/enterprise-security-operations-center/automations";

export function createDefaultSocSettings(): SocSettings {
  return {
    emergencyLockdown: false,
    autoBlockEnabled: true,
    autoQuarantineEnabled: true,
    autoNotifyEnabled: true,
    autoEscalateEnabled: true,
    autoIncidentCreation: true,
    mfaRequired: true,
    approvalWorkflowEnabled: true,
  };
}

export function createDefaultSocState(): SocState {
  const events = createDefaultEvents();
  const intrusions = createDefaultIntrusions();
  const scannerResults = createDefaultScannerResults();
  const sessions = createDefaultSessions();

  return {
    events,
    threats: createDefaultThreats(),
    intrusions,
    scannerResults,
    firewallRules: createDefaultFirewallRules(),
    devices: createDefaultDevices(),
    sessions,
    vulnerabilities: createDefaultVulnerabilities(),
    aiInsights: generateSocAiInsights(events, intrusions),
    automations: createDefaultAutomations(),
    auditTimeline: [
      { id: "audit-1", action: "scan", actor: "SCAN AI", timestamp: new Date().toISOString() },
      { id: "audit-2", action: "block", actor: "super-admin", timestamp: new Date().toISOString() },
    ],
  };
}

export function buildSocDashboard(state: SocState, settings: SocSettings): SocDashboard {
  const scanAvg = averageScanScore(state.scannerResults);
  const vulnRisk = vulnerabilityRiskScore(state.vulnerabilities);
  const securityScore = Math.max(0, Math.min(100, scanAvg - vulnRisk + 10));

  return {
    threatLevel: computeThreatLevel(state.events),
    securityScore,
    blockedAttacks: blockedEvents(state.events).length,
    criticalAlerts: criticalEvents(state.events).length,
    suspiciousSessions: suspiciousSessions(state.sessions).length,
    failedLogins: state.intrusions.find((i) => i.type === "brute-force")?.count ?? 0,
    bruteForceAttempts: state.intrusions.filter((i) => i.type === "brute-force").reduce((s, i) => s + i.count, 0),
    botDetections: state.intrusions.filter((i) => i.type === "bot-activity").length,
    malwareDetections: state.events.filter((e) => e.summary.toLowerCase().includes("malware")).length,
    credentialAbuse: state.intrusions.filter((i) => i.type === "credential-stuffing").reduce((s, i) => s + i.count, 0),
    apiAbuse: state.intrusions.filter((i) => i.type === "api-abuse").reduce((s, i) => s + i.count, 0),
    firewallStatus: firewallStatus(state.firewallRules, settings.emergencyLockdown),
    mfaCoverage: mfaCoverage(state.sessions),
    openVulnerabilities: openVulnerabilities(state.vulnerabilities).length,
    securityHealth: securityScore,
    liveThreatFeedCount: liveEvents(state.events).length,
  };
}

export function countActiveThreats(state: SocState): number {
  return activeIntrusions(state.intrusions).length + criticalEvents(state.events).length;
}
