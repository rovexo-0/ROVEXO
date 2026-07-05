import type { AiEngineModule } from "@/lib/ai-engine/types";

export const AI_ENGINE_MODULES: AiEngineModule[] = [
  { id: "control-center", label: "AI Control Center", icon: "🎛️", description: "Global AI orchestration", href: "/ai" },
  { id: "marketplace-assistant", label: "AI Marketplace Assistant", icon: "🤖", description: "Platform-wide assistant", href: "/assistant" },
  { id: "buyer-assistant", label: "AI Buyer Assistant", icon: "🛍️", description: "Shopping and recommendations", href: "/assistant?persona=buyer" },
  { id: "seller-assistant", label: "AI Seller Assistant", icon: "🏷️", description: "Listing and sales guidance", href: "/assistant?persona=seller" },
  { id: "business-assistant", label: "AI Business Assistant", icon: "🏢", description: "B2B insights and reports", href: "/business/dashboard" },
  { id: "super-admin-assistant", label: "AI Super Admin Assistant", icon: "🛰️", description: "Operations and monitoring", href: "/super-admin/operations" },
  { id: "developer-assistant", label: "AI Developer Assistant", icon: "🛠️", description: "Build and deploy guidance", href: "/super-admin/developer" },
  { id: "customer-support", label: "AI Customer Support", icon: "🎧", description: "Ticket classification and replies", href: "/support" },
  { id: "automation-center", label: "AI Automation Center", icon: "⚙️", description: "Workflows and smart routing", href: "/super-admin/operations" },
  { id: "prompt-library", label: "AI Prompt Library", icon: "📚", description: "Managed prompt templates", href: "/super-admin/ai-engine" },
  { id: "provider-manager", label: "AI Provider Manager", icon: "☁️", description: "Local and cloud providers", href: "/super-admin/ai-engine" },
  { id: "monitoring-center", label: "AI Monitoring Center", icon: "📊", description: "Requests, latency, and health", href: "/super-admin/operations" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order intelligence events", href: "/orders" },
  { id: "analytics", label: "Analytics Integration", icon: "📈", description: "AI insights and forecasting", href: "/analytics" },
  { id: "security", label: "Security Integration", icon: "🔒", description: "AI permission and audit", href: "/security" },
  { id: "search", label: "Search Integration", icon: "🔍", description: "Semantic search and suggestions", href: "/search" },
  { id: "recovery", label: "Recovery Center", icon: "💾", description: "AI config backup and restore", href: "/super-admin/recovery" },
];

export const AI_ENGINE_MODULE_IDS = [
  { id: "control-center", label: "AI Control Center" },
  { id: "marketplace-assistant", label: "AI Marketplace Assistant" },
  { id: "buyer-assistant", label: "AI Buyer Assistant" },
  { id: "seller-assistant", label: "AI Seller Assistant" },
  { id: "business-assistant", label: "AI Business Assistant" },
  { id: "super-admin-assistant", label: "AI Super Admin Assistant" },
  { id: "developer-assistant", label: "AI Developer Assistant" },
  { id: "customer-support", label: "AI Customer Support" },
  { id: "automation-center", label: "AI Automation Center" },
  { id: "prompt-library", label: "AI Prompt Library" },
  { id: "provider-manager", label: "AI Provider Manager" },
  { id: "monitoring-center", label: "AI Monitoring Center" },
] as const;

export const AI_ENGINE_PROVIDERS = [
  { id: "local", label: "Local AI Engine", execution: "local" as const },
  { id: "cloud", label: "Cloud AI", execution: "cloud" as const },
  { id: "openai", label: "OpenAI", execution: "cloud" as const },
  { id: "anthropic", label: "Anthropic", execution: "cloud" as const },
  { id: "google", label: "Google", execution: "cloud" as const },
  { id: "microsoft", label: "Microsoft", execution: "cloud" as const },
  { id: "ollama", label: "Ollama", execution: "local" as const },
  { id: "lm-studio", label: "LM Studio", execution: "local" as const },
  { id: "custom", label: "Custom Provider", execution: "hybrid" as const },
] as const;

export const AI_ENGINE_ROLES = [
  { id: "buyer", label: "Buyer" },
  { id: "seller", label: "Seller" },
  { id: "business", label: "Business" },
  { id: "support", label: "Support" },
  { id: "moderator", label: "Moderator" },
  { id: "administrator", label: "Administrator" },
  { id: "super-administrator", label: "Super Administrator" },
  { id: "developer", label: "Developer" },
] as const;

export function registerAiEngineModule(module: AiEngineModule): AiEngineModule[] {
  const index = AI_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...AI_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...AI_ENGINE_MODULES, module];
}
