import type { IntegrationsEngineModule } from "@/lib/integrations-engine/types";

export const INTEGRATIONS_ENGINE_MODULES: IntegrationsEngineModule[] = [
  { id: "integration-center", label: "Integration Center", icon: "🔌", description: "Unified external services hub", href: "/integrations" },
  { id: "api-manager", label: "API Manager", icon: "🌐", description: "REST, keys, and rate limits", href: "/super-admin/developer" },
  { id: "oauth-manager", label: "OAuth Manager", icon: "🔑", description: "OAuth and token flows", href: "/super-admin/integrations-engine" },
  { id: "webhook-manager", label: "Webhook Manager", icon: "📡", description: "Incoming and outgoing webhooks", href: "/super-admin/integrations-engine" },
  { id: "provider-manager", label: "Provider Manager", icon: "☁️", description: "Third-party provider registry", href: "/super-admin/integrations-engine" },
  { id: "secrets-manager", label: "Secrets Manager", icon: "🔒", description: "API keys and certificates", href: "/super-admin/integrations-engine" },
  { id: "health-monitor", label: "Health Monitor", icon: "💚", description: "Provider status and latency", href: "/super-admin/monitoring" },
  { id: "integration-analytics", label: "Integration Analytics", icon: "📈", description: "Success rates and performance", href: "/analytics" },
  { id: "integration-logs", label: "Integration Logs", icon: "📋", description: "Webhook and API audit logs", href: "/super-admin/audit" },
  { id: "testing-center", label: "Testing Center", icon: "🧪", description: "Integration test harness", href: "/super-admin/integrations-engine" },
  { id: "payments", label: "Payments Integration", icon: "💳", description: "Stripe and payment providers", href: "/payments" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Carrier and logistics providers", href: "/shipping" },
  { id: "notifications", label: "Notifications Integration", icon: "🔔", description: "Email, SMS, and push", href: "/notifications" },
  { id: "security", label: "Security Integration", icon: "🛡️", description: "Secrets and access control", href: "/security" },
  { id: "recovery", label: "Recovery Center", icon: "💾", description: "Integration backup and restore", href: "/super-admin/recovery" },
];

export const INTEGRATIONS_ENGINE_MODULE_IDS = [
  { id: "integration-center", label: "Integration Center" },
  { id: "api-manager", label: "API Manager" },
  { id: "oauth-manager", label: "OAuth Manager" },
  { id: "webhook-manager", label: "Webhook Manager" },
  { id: "provider-manager", label: "Provider Manager" },
  { id: "secrets-manager", label: "Secrets Manager" },
  { id: "health-monitor", label: "Health Monitor" },
  { id: "integration-analytics", label: "Integration Analytics" },
  { id: "integration-logs", label: "Integration Logs" },
  { id: "testing-center", label: "Testing Center" },
] as const;

export function registerIntegrationsEngineModule(module: IntegrationsEngineModule): IntegrationsEngineModule[] {
  const index = INTEGRATIONS_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...INTEGRATIONS_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...INTEGRATIONS_ENGINE_MODULES, module];
}
