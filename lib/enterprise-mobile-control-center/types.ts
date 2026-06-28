import type {
  DEVICE_ACTIONS,
  DOWNLOAD_TYPES,
  MOBILE_AI_MONITOR_TYPES,
  MOBILE_AI_SUGGESTION_TYPES,
  OTA_ROLLOUT_TYPES,
  PUSH_TYPES,
  UNIQUE_BUILD_TYPES,
} from "@/lib/enterprise-mobile-control-center/registry";

export type MobileCcTab = "dashboard" | "builds" | "downloads" | "ios" | "android" | "devices" | "ota" | "push";
export type BuildType = (typeof UNIQUE_BUILD_TYPES)[number];
export type DownloadType = (typeof DOWNLOAD_TYPES)[number];
export type OtaRolloutType = (typeof OTA_ROLLOUT_TYPES)[number];
export type PushType = (typeof PUSH_TYPES)[number];
export type DeviceAction = (typeof DEVICE_ACTIONS)[number];
export type MobileAiMonitorType = (typeof MOBILE_AI_MONITOR_TYPES)[number];
export type MobileAiSuggestionType = (typeof MOBILE_AI_SUGGESTION_TYPES)[number];

export type MobileBuild = {
  id: string;
  type: BuildType;
  platform: "android" | "ios";
  version: string;
  buildNumber: number;
  status: "queued" | "building" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
};

export type MobileRelease = {
  id: string;
  platform: "android" | "ios";
  channel: "production" | "beta" | "internal" | "testflight";
  version: string;
  buildNumber: number;
  status: "draft" | "published" | "rolled-back";
  publishedAt?: string;
  releaseNotes?: string;
};

export type MobileDevice = {
  id: string;
  name: string;
  platform: "android" | "ios";
  appVersion: string;
  online: boolean;
  lastSync: string;
  lastLogin: string;
  battery: number;
  pushToken: string;
  securityStatus: "trusted" | "warning" | "blocked";
  healthScore: number;
};

export type MobileDownload = {
  id: string;
  type: DownloadType;
  platform: "android" | "ios";
  version: string;
  url: string;
  qrCode?: string;
  createdAt: string;
};

export type OtaUpdate = {
  id: string;
  type: OtaRolloutType;
  version: string;
  status: "draft" | "rolling-out" | "completed" | "rolled-back";
  rolloutPercent: number;
  createdAt: string;
};

export type PushCampaign = {
  id: string;
  type: PushType;
  title: string;
  body: string;
  status: "draft" | "sent" | "failed";
  deliveryRate: number;
  sentAt?: string;
};

export type MobileCcSettings = {
  productionVersion: string;
  betaVersion: string;
  internalVersion: string;
  otaEnabled: boolean;
  pushEnabled: boolean;
  approvalRequiredForPublish: boolean;
  gradualRolloutDefault: number;
};

export type MobileCcDashboard = {
  androidBuild: string;
  iosBuild: string;
  productionVersion: string;
  betaVersion: string;
  internalVersion: string;
  latestRelease: string;
  activeDevices: number;
  installedDevices: number;
  crashReports: number;
  pushStatus: "healthy" | "degraded" | "offline";
  otaStatus: "idle" | "rolling-out" | "completed";
  buildQueue: number;
  releaseHealth: number;
};

export type MobileAnalytics = {
  activeInstallations: number;
  dailyActiveDevices: number;
  monthlyActiveDevices: number;
  retention: number;
  crashes: number;
  avgStartupMs: number;
  avgSyncMs: number;
  pushDeliveryRate: number;
  versionDistribution: Record<string, number>;
};

export type MobileAiInsight = {
  id: string;
  monitorType: MobileAiMonitorType;
  score: number;
  summary: string;
};

export type MobileAiSuggestion = {
  id: string;
  type: MobileAiSuggestionType;
  title: string;
  description: string;
  confidence: number;
};

export type MobileCcState = {
  builds: MobileBuild[];
  releases: MobileRelease[];
  devices: MobileDevice[];
  downloads: MobileDownload[];
  otaUpdates: OtaUpdate[];
  pushCampaigns: PushCampaign[];
  buildHistory: MobileBuild[];
  aiInsights: MobileAiInsight[];
  aiSuggestions: MobileAiSuggestion[];
};

export type MobileCcSnapshot = {
  tab: MobileCcTab;
  dashboard: MobileCcDashboard;
  analytics: MobileAnalytics;
  builds: MobileBuild[];
  releases: MobileRelease[];
  devices: MobileDevice[];
  downloads: MobileDownload[];
  otaUpdates: OtaUpdate[];
  pushCampaigns: PushCampaign[];
  buildHistory: MobileBuild[];
  aiInsights: MobileAiInsight[];
  aiSuggestions: MobileAiSuggestion[];
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlags: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};
