export type CommandCenterModuleStatus = "live" | "partial" | "planned";

export type CommandCenterModule = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: CommandCenterCategory;
  status: CommandCenterModuleStatus;
  icon?: string;
};

export type CommandCenterCategory =
  | "dashboard"
  | "users"
  | "commerce"
  | "payments"
  | "shipping"
  | "content"
  | "ai"
  | "notifications"
  | "security"
  | "database"
  | "analytics"
  | "system";

export type CommandCenterRegistry = {
  version: string;
  generatedAt: string;
  categories: Array<{
    id: CommandCenterCategory;
    label: string;
    modules: CommandCenterModule[];
  }>;
};
