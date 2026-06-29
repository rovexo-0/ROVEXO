export type PlatformStudioFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "email"
  | "password"
  | "phone"
  | "country"
  | "language"
  | "date"
  | "time"
  | "datetime"
  | "checkbox"
  | "switch"
  | "radio"
  | "dropdown"
  | "multi-select"
  | "tags"
  | "location"
  | "map"
  | "address"
  | "image-upload"
  | "video-upload"
  | "document-upload"
  | "signature"
  | "rating"
  | "color-picker"
  | "icon-picker"
  | "slider"
  | "repeater"
  | "hidden"
  | "divider"
  | "rich-text"
  | "markdown"
  | "json"
  | "ai-input"
  | "barcode"
  | "qr-code";

export type PlatformStudioPublishStatus = "draft" | "published" | "archived";

export type PlatformStudioFormField = {
  id: string;
  type: PlatformStudioFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  hidden: boolean;
  order: number;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  defaultValue?: unknown;
  displayRules?: { showWhen?: string; hideWhen?: string };
};

export type PlatformStudioForm = {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  fields: PlatformStudioFormField[];
  status: PlatformStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type WorkflowStepType =
  | "condition"
  | "action"
  | "delay"
  | "approval"
  | "notification"
  | "webhook"
  | "email"
  | "push"
  | "internal-message";

export type PlatformStudioWorkflowStep = {
  id: string;
  type: WorkflowStepType;
  label: string;
  config: Record<string, unknown>;
  next?: string[];
};

export type PlatformStudioWorkflow = {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  steps: PlatformStudioWorkflowStep[];
  status: PlatformStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type PlatformStudioWidgetType =
  | "chart"
  | "statistics"
  | "table"
  | "list"
  | "recent-activity"
  | "notifications"
  | "orders"
  | "wallet"
  | "revenue"
  | "messages"
  | "visitors"
  | "products"
  | "businesses"
  | "live-users"
  | "platform-health";

export type PlatformStudioDashboardWidget = {
  id: string;
  type: PlatformStudioWidgetType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: Record<string, unknown>;
};

export type PlatformStudioDashboard = {
  id: string;
  moduleId: string;
  name: string;
  audience: "buyer" | "seller" | "business" | "admin" | "support" | "analytics" | "developer";
  widgets: PlatformStudioDashboardWidget[];
  status: PlatformStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type PlatformStudioAutomation = {
  id: string;
  moduleId: string;
  name: string;
  trigger: { type: string; label: string };
  conditions: { id: string; expression: string }[];
  actions: { id: string; type: string; label: string; config?: Record<string, unknown> }[];
  schedule?: string;
  aiEnabled: boolean;
  status: PlatformStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type PlatformStudioPermission =
  | "read"
  | "write"
  | "publish"
  | "delete"
  | "approve"
  | "reject"
  | "refund"
  | "withdraw"
  | "moderate"
  | "manage-ai"
  | "manage-theme"
  | "manage-assets"
  | "manage-users"
  | "manage-orders"
  | "manage-shipping"
  | "manage-payments";

export type PlatformStudioRole = {
  id: string;
  name: string;
  description?: string;
  permissions: PlatformStudioPermission[];
  status: PlatformStudioPublishStatus;
};

export type PlatformStudioFieldConfig = {
  id: string;
  moduleId: string;
  fieldKey: string;
  label: string;
  hidden: boolean;
  required: boolean;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  defaultValue?: unknown;
  displayRules?: { showWhen?: string; hideWhen?: string };
};

export type PlatformStudioPage = {
  id: string;
  name: string;
  pageType: string;
  route?: string;
  componentIds: string[];
  status: PlatformStudioPublishStatus;
  version: number;
  updatedAt: string;
};

export type PlatformStudioComponentEntry = {
  id: string;
  type: string;
  moduleId: string;
  label: string;
  version: number;
  shared: boolean;
  archived: boolean;
  updatedAt: string;
};

export type PlatformStudioHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: PlatformStudioDocument;
  rollbackAvailable: boolean;
};

export type PlatformStudioAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type PlatformStudioModule = {
  id: string;
  label: string;
  icon: string;
  category: "marketplace" | "commerce" | "people" | "platform" | "insights" | "design";
  href?: string;
  builders: ("forms" | "workflows" | "dashboards" | "automations" | "permissions" | "database" | "pages")[];
};

export type PlatformStudioDocument = {
  version: number;
  updatedAt: string;
  label: string;
  forms: PlatformStudioForm[];
  workflows: PlatformStudioWorkflow[];
  dashboards: PlatformStudioDashboard[];
  automations: PlatformStudioAutomation[];
  roles: PlatformStudioRole[];
  fieldConfigs: PlatformStudioFieldConfig[];
  pages: PlatformStudioPage[];
  componentRegistry: PlatformStudioComponentEntry[];
  auditLog: PlatformStudioAuditEntry[];
};

export type PlatformStudioSnapshot = {
  scannedAt: string;
  modules: PlatformStudioModule[];
  draft: PlatformStudioDocument;
  live: PlatformStudioDocument;
  history: PlatformStudioHistoryEntry[];
};
