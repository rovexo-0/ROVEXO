export type ScanSeverity = "healthy" | "warning" | "critical";

export type ScanResultItem = {
  id: string;
  label: string;
  status: ScanSeverity;
  message: string;
  durationMs: number;
};

export type DetectedIssue = {
  id: string;
  problem: string;
  cause: string;
  severity: ScanSeverity;
  affectedFiles: string[];
  suggestedFix: string;
  repairId: string | null;
  rollbackAvailable: boolean;
};

export type RepairPatch = {
  id: string;
  issueId: string;
  title: string;
  description: string;
  diff: string;
  createdAt: string;
  appliedAt: string | null;
  rolledBackAt: string | null;
};

export type Recommendation = {
  id: string;
  title: string;
  category: string;
  estimatedGain: string;
  difficulty: "low" | "medium" | "high";
  filesAffected: string[];
  detail: string;
};

export type LiveServiceStatus = {
  id: string;
  label: string;
  status: ScanSeverity;
  detail: string;
};

export type IncidentRecord = {
  id: string;
  date: string;
  issue: string;
  aiSolution: string;
  repairTimeMs: number;
  status: "completed" | "failed" | "rolled_back";
  rollbackAvailable: boolean;
};

export type PerformanceSnapshot = {
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  apiLatencyMs: number;
  responseTimeMs: number;
  requestsPerMinute: number;
  errorRate: number;
  history: {
    apiLatency: number[];
    errors: number[];
    requests: number[];
  };
};

export type SecuritySnapshot = {
  rateLimitingEnabled: boolean;
  failedLogins24h: number;
  suspiciousIps: string[];
  blockedAttacks24h: number;
  jwtStatus: ScanSeverity;
  apiSecurityStatus: ScanSeverity;
  securityHeaders: string[];
};

export type LogEntry = {
  id: string;
  level: string;
  category: string;
  message: string;
  createdAt: string;
};

export type AiOperationsSettings = {
  autoRepairEnabled: boolean;
  lastScanAt: string | null;
  lastAutoRepairAt: string | null;
};

export type AiOperationsSummary = {
  platformHealth: ScanSeverity;
  aiStatus: ScanSeverity;
  activeAlerts: number;
  autoRepairsToday: number;
  criticalIssues: number;
  serverResponseMs: number;
  cpuPercent: number;
  memoryPercent: number;
  storagePercent: number;
};

export type AiOperationsSnapshot = {
  summary: AiOperationsSummary;
  scanResults: ScanResultItem[];
  issues: DetectedIssue[];
  recommendations: Recommendation[];
  liveServices: LiveServiceStatus[];
  settings: AiOperationsSettings;
  incidents: IncidentRecord[];
  performance: PerformanceSnapshot;
  security: SecuritySnapshot;
  logs: Record<string, LogEntry[]>;
  patches: RepairPatch[];
};
