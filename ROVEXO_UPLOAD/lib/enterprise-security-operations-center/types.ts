import type {
  AI_SECURITY_SOURCES,
  COMPLIANCE_FRAMEWORKS,
  FIREWALL_RULE_TYPES,
  INTRUSION_TYPES,
  SCANNER_TYPES,
  SOC_AUTOMATIONS,
  SOC_EVENT_CATEGORIES,
  THREAT_LEVELS,
} from "@/lib/enterprise-security-operations-center/registry";

export type SocTab =
  | "dashboard"
  | "live"
  | "threats"
  | "firewall"
  | "devices"
  | "sessions"
  | "scanner"
  | "vulnerabilities"
  | "compliance"
  | "audit"
  | "settings";

export type SocEventCategory = (typeof SOC_EVENT_CATEGORIES)[number];
export type ThreatLevel = (typeof THREAT_LEVELS)[number];
export type IntrusionType = (typeof INTRUSION_TYPES)[number];
export type ScannerType = (typeof SCANNER_TYPES)[number];
export type FirewallRuleType = (typeof FIREWALL_RULE_TYPES)[number];
export type SocAutomation = (typeof SOC_AUTOMATIONS)[number];
export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];
export type AiSecuritySource = (typeof AI_SECURITY_SOURCES)[number];

export type SecurityEvent = {
  id: string;
  category: SocEventCategory;
  level: ThreatLevel;
  summary: string;
  source: string;
  ip?: string;
  country?: string;
  timestamp: string;
  blocked?: boolean;
};

export type ThreatIntelligence = {
  id: string;
  ip: string;
  country: string;
  asn: string;
  vpnDetected: boolean;
  torDetected: boolean;
  proxyDetected: boolean;
  hostingDetected: boolean;
  knownBot: boolean;
  confidence: number;
  geoRisk: "low" | "medium" | "high";
};

export type IntrusionAlert = {
  id: string;
  type: IntrusionType;
  level: ThreatLevel;
  target: string;
  count: number;
  lastSeen: string;
  mitigated: boolean;
};

export type ScannerResult = {
  id: string;
  type: ScannerType;
  status: "passed" | "warning" | "failed";
  score: number;
  findings: string[];
  scannedAt: string;
};

export type FirewallRule = {
  id: string;
  type: FirewallRuleType;
  label: string;
  value: string;
  action: "allow" | "block" | "rate-limit";
  enabled: boolean;
};

export type DeviceRecord = {
  id: string;
  fingerprint: string;
  platform: string;
  trusted: boolean;
  lastSeen: string;
  sessionCount: number;
  locked: boolean;
};

export type SessionRecord = {
  id: string;
  userId: string;
  ip: string;
  country: string;
  deviceId?: string;
  suspicious: boolean;
  mfaVerified: boolean;
  startedAt: string;
  lastActivity: string;
};

export type VulnerabilityRecord = {
  id: string;
  severity: ThreatLevel;
  component: string;
  cve?: string;
  description: string;
  status: "open" | "mitigated" | "accepted";
};

export type AiSecurityInsight = {
  id: string;
  source: AiSecuritySource;
  type: "threat" | "risk" | "anomaly" | "correlation" | "auto-response" | "prediction";
  summary: string;
  confidence: number;
  recommendedAction?: string;
};

export type SocSettings = {
  emergencyLockdown: boolean;
  autoBlockEnabled: boolean;
  autoQuarantineEnabled: boolean;
  autoNotifyEnabled: boolean;
  autoEscalateEnabled: boolean;
  autoIncidentCreation: boolean;
  mfaRequired: boolean;
  approvalWorkflowEnabled: boolean;
};

export type SocDashboard = {
  threatLevel: ThreatLevel;
  securityScore: number;
  blockedAttacks: number;
  criticalAlerts: number;
  suspiciousSessions: number;
  failedLogins: number;
  bruteForceAttempts: number;
  botDetections: number;
  malwareDetections: number;
  credentialAbuse: number;
  apiAbuse: number;
  firewallStatus: "active" | "degraded" | "lockdown";
  mfaCoverage: number;
  openVulnerabilities: number;
  securityHealth: number;
  liveThreatFeedCount: number;
};

export type SocState = {
  events: SecurityEvent[];
  threats: ThreatIntelligence[];
  intrusions: IntrusionAlert[];
  scannerResults: ScannerResult[];
  firewallRules: FirewallRule[];
  devices: DeviceRecord[];
  sessions: SessionRecord[];
  vulnerabilities: VulnerabilityRecord[];
  aiInsights: AiSecurityInsight[];
  automations: SocAutomation[];
  auditTimeline: Array<{ id: string; action: string; actor: string; timestamp: string }>;
};

export type SocSnapshot = {
  tab: SocTab;
  dashboard: SocDashboard;
  events: SecurityEvent[];
  liveEvents: SecurityEvent[];
  threats: ThreatIntelligence[];
  intrusions: IntrusionAlert[];
  scannerResults: ScannerResult[];
  firewallRules: FirewallRule[];
  devices: DeviceRecord[];
  sessions: SessionRecord[];
  vulnerabilities: VulnerabilityRecord[];
  aiInsights: AiSecurityInsight[];
  settings: SocSettings;
  complianceFrameworks: ComplianceFramework[];
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  auditTimeline: SocState["auditTimeline"];
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
