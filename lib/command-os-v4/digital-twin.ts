import type { CommandOsDigitalTwinNode } from "@/lib/command-os-v4/types";
import type { CommandCenterSection } from "@/lib/super-admin/command-center-v1/types";

function statusFromMetric(value: string | number): CommandOsDigitalTwinNode["status"] {
  const text = String(value).toLowerCase();
  if (text.includes("fail") || text.includes("critical") || text.includes("down")) return "critical";
  if (text.includes("warn") || text.includes("degraded") || text.includes("pending")) return "warning";
  if (value === 0 || value === "0") return "idle";
  return "healthy";
}

/** Live digital twin synthesized from Command Center production metrics. */
export function buildCommandOsDigitalTwin(sections: CommandCenterSection[]): CommandOsDigitalTwinNode[] {
  const nodes: CommandOsDigitalTwinNode[] = [
    { id: "marketplace", label: "Marketplace", category: "commerce", status: "healthy", href: "/super-admin/moderation" },
    { id: "orders", label: "Orders", category: "commerce", status: "healthy", href: "/super-admin/orders-engine" },
    { id: "payments", label: "Payments", category: "finance", status: "healthy", href: "/super-admin/payments-engine" },
    { id: "shipping", label: "Shipping", category: "logistics", status: "healthy", href: "/super-admin/shipping-engine" },
    { id: "infrastructure", label: "Infrastructure", category: "infra", status: "healthy", href: "/super-admin/database" },
    { id: "users", label: "Users", category: "identity", status: "healthy", href: "/super-admin/users" },
    { id: "traffic", label: "Traffic", category: "analytics", status: "healthy", href: "/super-admin/analytics-engine" },
    { id: "ai", label: "AI", category: "intelligence", status: "healthy", href: "/super-admin/ai-engine" },
    { id: "security", label: "Security", category: "security", status: "healthy", href: "/super-admin/security-engine" },
    { id: "servers", label: "Servers", category: "infra", status: "healthy", href: "/super-admin/monitoring" },
    { id: "queues", label: "Queues", category: "infra", status: "idle", href: "/super-admin/monitoring" },
    { id: "database", label: "Database", category: "infra", status: "healthy", href: "/super-admin/database" },
    { id: "search", label: "Search Engine", category: "discovery", status: "healthy", href: "/super-admin/search-engine" },
    { id: "storage", label: "Storage", category: "infra", status: "healthy", href: "/super-admin/database" },
  ];

  for (const section of sections) {
    for (const metric of section.metrics) {
      const node = nodes.find((n) => metric.id.includes(n.id) || metric.label.toLowerCase().includes(n.label.toLowerCase()));
      if (node) {
        node.value = metric.value;
        node.status = statusFromMetric(metric.value);
        node.href = metric.href ?? node.href;
      }
    }
  }

  return nodes;
}
