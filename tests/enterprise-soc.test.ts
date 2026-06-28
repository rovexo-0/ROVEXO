import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import {
  allAiSourcesPresent,
  generateSocAiInsights,
  omegaAutoResponseCount,
  scanThreatCount,
  sentinelCorrelationCount,
} from "@/lib/enterprise-security-operations-center/ai-integration";
import {
  canPerformSocAction,
  createSocAuditEntry,
  requiresMfaForSoc,
} from "@/lib/enterprise-security-operations-center/audit";
import { applySocAutomations, createDefaultAutomations, shouldSuggestRollback } from "@/lib/enterprise-security-operations-center/automations";
import { complianceScore, listComplianceFrameworks } from "@/lib/enterprise-security-operations-center/compliance";
import { isSocConfigAction } from "@/lib/enterprise-security-operations-center/config-actions";
import { lockDevice, mfaCoverage, revokeDevice, suspiciousSessions, untrustedDevices, createDefaultDevices, createDefaultSessions } from "@/lib/enterprise-security-operations-center/devices";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";
import { buildSocDashboard, createDefaultSocSettings, createDefaultSocState } from "@/lib/enterprise-security-operations-center/engine";
import {
  blockedEvents,
  computeThreatLevel,
  createDefaultEvents,
  createSecurityEvent,
  criticalEvents,
  isValidEventCategory,
  isValidThreatLevel,
  liveEvents,
} from "@/lib/enterprise-security-operations-center/events";
import { exportSocSnapshot, exportThreatReport, isValidSocExportFormat, parseSocImportPayload } from "@/lib/enterprise-security-operations-center/export";
import { activeRules, blockIpRule, createDefaultFirewallRules, firewallStatus } from "@/lib/enterprise-security-operations-center/firewall";
import { computeSocHealth } from "@/lib/enterprise-security-operations-center/health";
import { activeIntrusions, createDefaultIntrusions, intrusionSeverityScore, isValidIntrusionType } from "@/lib/enterprise-security-operations-center/intrusion";
import { validateSocReadiness } from "@/lib/enterprise-security-operations-center/reader";
import { ENTERPRISE_SOC_API, ENTERPRISE_SOC_ROUTES, INTRUSION_TYPES, SCANNER_TYPES, SOC_EVENT_CATEGORIES } from "@/lib/enterprise-security-operations-center/registry";
import { averageScanScore, createDefaultScannerResults, failedScans, isValidScannerType, runFullScan } from "@/lib/enterprise-security-operations-center/scanner";
import { anonymizedThreats, botThreats, createDefaultThreats, highRiskThreats } from "@/lib/enterprise-security-operations-center/threats";
import type { SocSnapshot } from "@/lib/enterprise-security-operations-center/types";
import { createDefaultVulnerabilities, openVulnerabilities, vulnerabilityRiskScore } from "@/lib/enterprise-security-operations-center/vulnerabilities";

function sampleSnapshot(overrides: Partial<SocSnapshot> = {}): SocSnapshot {
  const state = createDefaultSocState();
  const settings = createDefaultSocSettings();
  return {
    tab: "dashboard",
    dashboard: buildSocDashboard(state, settings),
    events: state.events,
    liveEvents: liveEvents(state.events),
    threats: state.threats,
    intrusions: state.intrusions,
    scannerResults: state.scannerResults,
    firewallRules: state.firewallRules,
    devices: state.devices,
    sessions: state.sessions,
    vulnerabilities: state.vulnerabilities,
    aiInsights: state.aiInsights,
    settings,
    complianceFrameworks: listComplianceFrameworks(),
    history: [],
    auditLog: [],
    auditTimeline: state.auditTimeline,
    featureFlagsConfig: {
      enterprise_soc_v1: true,
      live_monitoring_enabled: true,
      ai_security_enabled: true,
      firewall_enabled: true,
      scanner_enabled: true,
      automations_enabled: true,
      compliance_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: 85, message: "ok" },
    ...overrides,
  };
}

describe("enterprise soc descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_SOC_MODULE_DESCRIPTOR.id).toBe("enterprise-security-operations-center");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_SOC_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_SOC_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/security");
  });

  it("has master feature flag", () => {
    expect(ENTERPRISE_SOC_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_soc_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-security-operations-center")?.id).toBe("enterprise-security-operations-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-security-operations-center")?.moduleId).toBe("enterprise-security-operations-center");
  });

  it("lists routes", () => {
    expect(ENTERPRISE_SOC_ROUTES.length).toBeGreaterThanOrEqual(11);
  });

  it("relates to incident response and ai os", () => {
    expect(ENTERPRISE_SOC_MODULE_DESCRIPTOR.relatedModules).toContain("incident-response-center");
    expect(ENTERPRISE_SOC_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-ai-operating-system");
  });
});

describe("security events", () => {
  it("creates default events", () => {
    expect(createDefaultEvents().length).toBeGreaterThan(0);
  });

  it("creates security event", () => {
    const event = createSecurityEvent({ category: "api", level: "high", summary: "Test", source: "SCAN AI" });
    expect(event.id).toMatch(/^SEC-/);
  });

  it("validates event category", () => {
    expect(isValidEventCategory("authentication")).toBe(true);
    expect(SOC_EVENT_CATEGORIES).toHaveLength(16);
  });

  it("validates threat level", () => {
    expect(isValidThreatLevel("critical")).toBe(true);
  });

  it("computes threat level", () => {
    expect(computeThreatLevel(createDefaultEvents())).toBeDefined();
  });

  it("filters live events", () => {
    expect(liveEvents(createDefaultEvents()).length).toBeGreaterThan(0);
  });

  it("filters blocked events", () => {
    expect(blockedEvents(createDefaultEvents()).length).toBeGreaterThanOrEqual(0);
  });

  it("filters critical events", () => {
    expect(criticalEvents(createDefaultEvents()).length).toBeGreaterThan(0);
  });
});

describe("soc dashboard", () => {
  it("builds dashboard", () => {
    const state = createDefaultSocState();
    const dashboard = buildSocDashboard(state, createDefaultSocSettings());
    expect(dashboard.securityScore).toBeGreaterThan(0);
    expect(dashboard.threatLevel).toBeDefined();
  });

  it("includes mfa coverage", () => {
    const dashboard = buildSocDashboard(createDefaultSocState(), createDefaultSocSettings());
    expect(dashboard.mfaCoverage).toBeGreaterThanOrEqual(0);
  });

  it("reports firewall status", () => {
    const dashboard = buildSocDashboard(createDefaultSocState(), createDefaultSocSettings());
    expect(["active", "degraded", "lockdown"]).toContain(dashboard.firewallStatus);
  });
});

describe("threat intelligence", () => {
  it("creates default threats", () => {
    expect(createDefaultThreats().length).toBeGreaterThan(0);
  });

  it("filters high risk threats", () => {
    expect(highRiskThreats(createDefaultThreats()).length).toBeGreaterThan(0);
  });

  it("detects bot threats", () => {
    expect(botThreats(createDefaultThreats()).length).toBeGreaterThan(0);
  });

  it("detects anonymized threats", () => {
    expect(anonymizedThreats(createDefaultThreats()).length).toBeGreaterThan(0);
  });
});

describe("intrusion detection", () => {
  it("creates default intrusions", () => {
    expect(createDefaultIntrusions().length).toBeGreaterThan(0);
  });

  it("validates intrusion type", () => {
    expect(isValidIntrusionType("brute-force")).toBe(true);
    expect(INTRUSION_TYPES).toHaveLength(9);
  });

  it("lists active intrusions", () => {
    expect(activeIntrusions(createDefaultIntrusions()).length).toBeGreaterThan(0);
  });

  it("computes intrusion severity score", () => {
    expect(intrusionSeverityScore(createDefaultIntrusions())).toBeGreaterThan(0);
  });
});

describe("security scanner", () => {
  it("creates scanner results", () => {
    expect(createDefaultScannerResults()).toHaveLength(SCANNER_TYPES.length);
  });

  it("validates scanner type", () => {
    expect(isValidScannerType("secrets")).toBe(true);
  });

  it("runs full scan", () => {
    expect(runFullScan()).toHaveLength(SCANNER_TYPES.length);
  });

  it("computes average scan score", () => {
    expect(averageScanScore(createDefaultScannerResults())).toBeGreaterThan(80);
  });

  it("finds failed scans", () => {
    expect(failedScans(createDefaultScannerResults()).length).toBeGreaterThanOrEqual(0);
  });
});

describe("firewall center", () => {
  it("creates firewall rules", () => {
    expect(createDefaultFirewallRules().length).toBeGreaterThan(0);
  });

  it("lists active rules", () => {
    expect(activeRules(createDefaultFirewallRules()).length).toBeGreaterThan(0);
  });

  it("reports firewall status", () => {
    expect(firewallStatus(createDefaultFirewallRules(), false)).toBe("active");
    expect(firewallStatus(createDefaultFirewallRules(), true)).toBe("lockdown");
  });

  it("creates block ip rule", () => {
    const rule = blockIpRule("203.0.113.1");
    expect(rule.action).toBe("block");
  });
});

describe("device and session security", () => {
  it("creates default devices", () => {
    expect(createDefaultDevices().length).toBeGreaterThan(0);
  });

  it("lists untrusted devices", () => {
    expect(untrustedDevices(createDefaultDevices()).length).toBeGreaterThan(0);
  });

  it("locks device", () => {
    expect(lockDevice(createDefaultDevices()[0]!).locked).toBe(true);
  });

  it("revokes device", () => {
    const revoked = revokeDevice(createDefaultDevices()[0]!);
    expect(revoked.trusted).toBe(false);
  });

  it("lists suspicious sessions", () => {
    expect(suspiciousSessions(createDefaultSessions()).length).toBeGreaterThan(0);
  });

  it("computes mfa coverage", () => {
    expect(mfaCoverage(createDefaultSessions())).toBeGreaterThan(0);
  });
});

describe("vulnerabilities", () => {
  it("creates default vulnerabilities", () => {
    expect(createDefaultVulnerabilities().length).toBeGreaterThan(0);
  });

  it("lists open vulnerabilities", () => {
    expect(openVulnerabilities(createDefaultVulnerabilities()).length).toBeGreaterThan(0);
  });

  it("computes vulnerability risk score", () => {
    expect(vulnerabilityRiskScore(createDefaultVulnerabilities())).toBeGreaterThan(0);
  });
});

describe("ai security integration", () => {
  it("generates ai insights", () => {
    const events = createDefaultEvents();
    const insights = generateSocAiInsights(events, createDefaultIntrusions());
    expect(insights.length).toBeGreaterThan(0);
  });

  it("includes all ai sources", () => {
    const insights = generateSocAiInsights(createDefaultEvents(), createDefaultIntrusions());
    expect(allAiSourcesPresent(insights)).toBe(true);
  });

  it("counts scan threats", () => {
    expect(scanThreatCount(generateSocAiInsights(createDefaultEvents(), createDefaultIntrusions()))).toBeGreaterThan(0);
  });

  it("counts sentinel correlations", () => {
    expect(sentinelCorrelationCount(generateSocAiInsights(createDefaultEvents(), createDefaultIntrusions()))).toBeGreaterThan(0);
  });

  it("counts omega auto responses", () => {
    expect(omegaAutoResponseCount(generateSocAiInsights(createDefaultEvents(), createDefaultIntrusions()))).toBeGreaterThan(0);
  });
});

describe("automations", () => {
  it("creates default automations", () => {
    expect(createDefaultAutomations().length).toBeGreaterThan(0);
  });

  it("applies auto block", () => {
    const event = createSecurityEvent({ category: "api", level: "critical", summary: "Attack", source: "test", ip: "1.2.3.4" });
    const { actions } = applySocAutomations(event, createDefaultSocSettings());
    expect(actions).toContain("auto-block");
  });

  it("suggests rollback for deployment events", () => {
    const event = createSecurityEvent({ category: "deployments", level: "critical", summary: "Fail", source: "test" });
    expect(shouldSuggestRollback(event)).toBe(true);
  });
});

describe("compliance", () => {
  it("lists compliance frameworks", () => {
    expect(listComplianceFrameworks().length).toBeGreaterThan(0);
  });

  it("computes compliance score", () => {
    expect(complianceScore(listComplianceFrameworks())).toBeGreaterThan(80);
  });
});

describe("export", () => {
  it("exports json snapshot", () => {
    expect(exportSocSnapshot(sampleSnapshot(), "json")).toContain("snapshot");
  });

  it("exports csv snapshot", () => {
    expect(exportSocSnapshot(sampleSnapshot(), "csv")).toContain("id,category");
  });

  it("exports threat report", () => {
    expect(exportThreatReport(sampleSnapshot(), "json")).toContain("203.0.113");
  });

  it("validates export format", () => {
    expect(isValidSocExportFormat("pdf")).toBe(true);
  });

  it("parses import payload", () => {
    expect(parseSocImportPayload('{"events":[]}')).toEqual({ events: [] });
  });
});

describe("audit and permissions", () => {
  it("allows view", () => {
    expect(canPerformSocAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for block", () => {
    expect(canPerformSocAction({ action: "block", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformSocAction({ action: "block", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for quarantine", () => {
    expect(requiresMfaForSoc("quarantine")).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createSocAuditEntry("block", "admin", "203.0.113.1").action).toBe("block");
  });

  it("identifies config actions", () => {
    expect(isSocConfigAction("publish-config")).toBe(true);
  });
});

describe("health and readiness", () => {
  it("computes soc health", () => {
    expect(computeSocHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports disabled when flag off", () => {
    expect(computeSocHealth(sampleSnapshot({ featureFlagsConfig: { enterprise_soc_v1: false } as SocSnapshot["featureFlagsConfig"] })).status).toBe("failed");
  });

  it("validates readiness", () => {
    const readiness = validateSocReadiness(sampleSnapshot());
    expect(readiness.ready).toBe(true);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(ENTERPRISE_SOC_API.snapshot).toBe("/api/super-admin/security");
  });

  it("exposes security action endpoints", () => {
    expect(ENTERPRISE_SOC_API.scan).toContain("scan");
    expect(ENTERPRISE_SOC_API.block).toContain("block");
    expect(ENTERPRISE_SOC_API.quarantine).toContain("quarantine");
    expect(ENTERPRISE_SOC_API.isolate).toContain("isolate");
    expect(ENTERPRISE_SOC_API.rotate).toContain("rotate");
    expect(ENTERPRISE_SOC_API.revoke).toContain("revoke");
    expect(ENTERPRISE_SOC_API.export).toContain("export");
    expect(ENTERPRISE_SOC_API.import).toContain("import");
  });

  it("exposes v1 snapshot", () => {
    expect(ENTERPRISE_SOC_API.v1Snapshot).toContain("/api/v1/");
  });
});
