import type {
  AI_INTEGRATION_SOURCES,
  AUTOMATION_RULES,
  INCIDENT_RESPONSE_CENTER_ROUTES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  PLAYBOOK_ACTIONS,
  TIMELINE_EVENT_TYPES,
} from "@/lib/incident-response-center/registry";

export type IncidentTab = (typeof INCIDENT_RESPONSE_CENTER_ROUTES)[number]["id"];
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];
export type PlaybookAction = (typeof PLAYBOOK_ACTIONS)[number];
export type AutomationRule = (typeof AUTOMATION_RULES)[number];
export type AiIntegrationSource = (typeof AI_INTEGRATION_SOURCES)[number];

export type IncidentRecord = {
  id: string;
  priority: IncidentSeverity;
  category: IncidentType;
  detectedBy: string;
  affectedService: string;
  startedAt: string;
  durationMinutes: number;
  owner?: string;
  status: IncidentStatus;
  title: string;
  description?: string;
  resolvedAt?: string;
};

export type TimelineEvent = {
  id: string;
  incidentId: string;
  type: TimelineEventType;
  actor: string;
  summary: string;
  timestamp: string;
};

export type RootCauseAnalysis = {
  incidentId: string;
  timeline: string[];
  dependencies: string[];
  recentDeployments: string[];
  affectedServices: string[];
  logCorrelation: string[];
  aiExplanation: string;
  confidencePercent: number;
  sources: AiIntegrationSource[];
};

export type PlaybookDefinition = {
  id: string;
  action: PlaybookAction;
  label: string;
  description: string;
  requiresMfa: boolean;
  estimatedMinutes: number;
};

export type PostmortemReport = {
  id: string;
  incidentId: string;
  summary: string;
  impact: string;
  timeline: string[];
  rootCause: string;
  fixApplied: string;
  lessonsLearned: string[];
  recommendations: string[];
  generatedAt: string;
};

export type AiSuggestion = {
  id: string;
  source: AiIntegrationSource;
  type: "anomaly" | "threat" | "repair" | "prediction" | "maintenance";
  summary: string;
  confidence: number;
  incidentId?: string;
};

export type IncidentSettings = {
  emergencyMode: boolean;
  autoAssignEnabled: boolean;
  autoEscalateEnabled: boolean;
  autoNotifyEnabled: boolean;
  autoRecoverEnabled: boolean;
  mfaRequired: boolean;
  defaultOwner: string;
  escalationThresholdMinutes: number;
};

export type IncidentDashboard = {
  activeIncidents: number;
  critical: number;
  major: number;
  minor: number;
  resolvedToday: number;
  averageResolutionMinutes: number;
  openAlerts: number;
  emergencyMode: boolean;
  aiSuggestions: number;
  recoveryQueue: number;
  deploymentsBlocked: number;
  rollbackCandidates: number;
};

export type IncidentState = {
  incidents: IncidentRecord[];
  timeline: TimelineEvent[];
  rootCauseAnalyses: RootCauseAnalysis[];
  postmortems: PostmortemReport[];
  playbooks: PlaybookDefinition[];
  aiSuggestions: AiSuggestion[];
  automations: AutomationRule[];
};

export type IncidentSnapshot = {
  tab: IncidentTab;
  dashboard: IncidentDashboard;
  incidents: IncidentRecord[];
  liveIncidents: IncidentRecord[];
  criticalIncidents: IncidentRecord[];
  timeline: TimelineEvent[];
  rootCauseAnalyses: RootCauseAnalysis[];
  postmortems: PostmortemReport[];
  playbooks: PlaybookDefinition[];
  aiSuggestions: AiSuggestion[];
  settings: IncidentSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
