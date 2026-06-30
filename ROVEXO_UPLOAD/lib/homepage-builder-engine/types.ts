import type { HOMEPAGE_COMPONENT_TYPES, HOMEPAGE_PREVIEW_MODES, HOMEPAGE_SECTION_TYPES } from "@/lib/homepage-builder-engine/registry";

export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number];
export type HomepageComponentType = (typeof HOMEPAGE_COMPONENT_TYPES)[number];
export type HomepagePreviewMode = (typeof HOMEPAGE_PREVIEW_MODES)[number];

export type HomepageBuilderTab =
  | "dashboard"
  | "editor"
  | "preview"
  | "components"
  | "history"
  | "schedule"
  | "settings";

export type HomepageSectionVisibility = {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
  countries: string[];
  languages: string[];
  loggedUser: boolean;
  guest: boolean;
  buyer: boolean;
  seller: boolean;
  business: boolean;
  premium: boolean;
  subscription: boolean;
};

export type HomepageSectionSettings = {
  visibility: HomepageSectionVisibility;
  schedule?: { startAt?: string; endAt?: string };
  featureFlag?: string;
  experiment?: string;
  rolloutPercent?: number;
  abTestVariant?: string;
};

export type HomepageSection = {
  id: string;
  type: HomepageSectionType;
  label: string;
  order: number;
  enabled: boolean;
  hidden: boolean;
  locked: boolean;
  pinned: boolean;
  published: boolean;
  settings: HomepageSectionSettings;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
};

export type HomepageComponent = {
  id: string;
  type: HomepageComponentType;
  label: string;
  reusable: boolean;
  config: Record<string, unknown>;
};

export type HomepageVersionEntry = {
  id: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
  label: string;
  rollbackAvailable: boolean;
  changeSummary: string;
};

export type HomepageScheduleEntry = {
  id: string;
  homepageId: string;
  publishAt: string;
  timezone: string;
  status: "scheduled" | "published" | "cancelled";
  createdBy: string;
};

export type HomepageBuilderSettings = {
  activeTheme: string;
  autosaveEnabled: boolean;
  autosaveIntervalMs: number;
  approvalRequired: boolean;
  aiAssistantEnabled: boolean;
  assetManagerIntegration: boolean;
  visualCmsIntegration: boolean;
};

export type HomepageDashboardMetrics = {
  productionSections: number;
  draftSections: number;
  scheduledHomepages: number;
  rollbackPoints: number;
  publishingQueue: number;
  healthScore: number;
  recentChanges: number;
};

export type HomepageBuilderDocument = {
  id: string;
  label: "Draft" | "Live" | "Preview";
  version: string;
  updatedAt: string;
  lastPublishedAt?: string;
  lastEditor?: string;
  sections: HomepageSection[];
  components: HomepageComponent[];
};

export type HomepageDiffResult = {
  added: string[];
  removed: string[];
  changed: string[];
  reordered: boolean;
};

export type HomepageValidationResult = {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
};

export type HomepageAiSuggestion = {
  id: string;
  type: "layout" | "seo" | "conversion" | "section" | "banner" | "cta";
  title: string;
  description: string;
  confidence: number;
};

export type HomepageBuilderSnapshot = {
  tab: HomepageBuilderTab;
  dashboard: HomepageDashboardMetrics;
  production: HomepageBuilderDocument;
  draft: HomepageBuilderDocument;
  scheduled?: HomepageScheduleEntry;
  previewMode: HomepagePreviewMode;
  history: HomepageVersionEntry[];
  schedules: HomepageScheduleEntry[];
  componentLibrary: HomepageComponent[];
  aiSuggestions: HomepageAiSuggestion[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlags: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
  integrations: {
    assetManager: boolean;
    visualCms: boolean;
    workflowEngine: boolean;
  };
};

export type HomepageEditorState = {
  sections: HomepageSection[];
  clipboard?: HomepageSection;
  undoStack: HomepageSection[][];
  redoStack: HomepageSection[][];
  selectedSectionId?: string;
};

export type HomepageAssetReference = {
  id: string;
  url: string;
  type: "image" | "video" | "svg";
  source: "asset-manager" | "visual-cms" | "upload";
};
