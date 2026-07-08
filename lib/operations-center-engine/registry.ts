import type { OperationsPlatformService, OperationsRecoveryAction } from "@/lib/operations-center-engine/types";

export const OPERATIONS_PLATFORM_SERVICES: Omit<OperationsPlatformService, "status" | "detail">[] = [
  { id: "platform-health", label: "Platform Health", icon: "💚", href: "/super-admin/operations/health" },
  { id: "api", label: "API Status", icon: "🔌", href: "/super-admin/monitoring" },
  { id: "database", label: "Database", icon: "🗄️", href: "/super-admin/operations/health" },
  { id: "authentication", label: "Authentication", icon: "🔐", href: "/super-admin/security-engine" },
  { id: "orders", label: "Orders", icon: "📦", href: "/super-admin/orders-engine" },
  { id: "wallet", label: "Wallet", icon: "💰", href: "/super-admin/wallet-engine" },
  { id: "payments", label: "Payments", icon: "💳", href: "/super-admin/payments-engine" },
  { id: "protection", label: "Purchase Protection", icon: "🛡️", href: "/super-admin/protection-engine" },
  { id: "shipping", label: "Shipping", icon: "🚚", href: "/super-admin/shipping-engine" },
  { id: "messages", label: "Messages", icon: "💬", href: "/super-admin/messages-engine" },
  { id: "notifications", label: "Notifications", icon: "🔔", href: "/super-admin/notifications-engine" },
  { id: "analytics", label: "Analytics", icon: "📊", href: "/super-admin/analytics-engine" },
  { id: "search", label: "Search", icon: "🔍", href: "/super-admin/search-engine" },
  { id: "ai", label: "AI", icon: "🤖", href: "/super-admin/ai-engine" },
  { id: "integrations", label: "Integrations", icon: "🔌", href: "/super-admin/integrations-engine" },
  { id: "security", label: "Security", icon: "🔒", href: "/super-admin/security-engine" },
  { id: "asset-manager", label: "Asset Manager", icon: "✨", href: "/super-admin/assets" },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", href: "/super-admin/visual-cms" },
  { id: "theme-studio", label: "Theme Studio", icon: "🎨", href: "/super-admin/theme-studio" },
  { id: "platform-studio", label: "Platform Studio", icon: "🧩", href: "/super-admin/platform-studio" },
];

export const OPERATIONS_RECOVERY_ACTIONS: OperationsRecoveryAction[] = [
  { id: "restart-worker", label: "Restart Worker", description: "Restart background workers", enabled: true, dangerous: true },
  { id: "restart-queue", label: "Restart Queue", description: "Restart job queue processors", enabled: true, dangerous: true },
  { id: "clear-cache", label: "Clear Cache", description: "Clear application cache layers", enabled: true, dangerous: false },
  { id: "flush-queue", label: "Flush Queue", description: "Flush pending queue jobs", enabled: true, dangerous: true },
  { id: "retry-failed-jobs", label: "Retry Failed Jobs", description: "Retry failed background jobs", enabled: true, dangerous: false },
  { id: "reconnect-database", label: "Reconnect Database", description: "Reconnect database pool", enabled: true, dangerous: true },
  { id: "reconnect-redis", label: "Reconnect Redis", description: "Reconnect Redis cache", enabled: true, dangerous: true },
  { id: "revalidate-assets", label: "Revalidate Assets", description: "Revalidate CDN asset cache", enabled: true, dangerous: false },
  { id: "regenerate-search-index", label: "Regenerate Search Index", description: "Rebuild search index", enabled: true, dangerous: false },
  { id: "regenerate-images", label: "Regenerate Images", description: "Regenerate responsive images", enabled: true, dangerous: false },
  { id: "restart-webhooks", label: "Restart Webhooks", description: "Restart webhook listeners", enabled: true, dangerous: true },
  { id: "emergency-safe-mode", label: "Emergency Safe Mode", description: "Enable emergency safe mode", enabled: true, dangerous: true },
];

export const OPERATIONS_LOG_CATEGORIES = [
  "application",
  "api",
  "system",
  "security",
  "authentication",
  "payment",
  "shipping",
  "webhook",
  "cron",
  "deployment",
  "error",
  "audit",
] as const;
