import type { WorkflowNode, WorkflowTemplate } from "@/lib/enterprise-workflow-engine/types";

function baseNodes(triggerLabel: string): WorkflowNode[] {
  return [
    { id: "start", type: "start", label: "Start", config: {}, next: ["action"] },
    { id: "action", type: "notification", label: triggerLabel, config: { channel: "enterprise" }, next: ["end"] },
    { id: "end", type: "end", label: "End", config: {} },
  ];
}

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tpl-order-paid",
    name: "Order Paid Notification",
    description: "Notify seller and buyer when an order is paid",
    category: "commerce",
    trigger: "order-paid",
    tags: ["orders", "notifications"],
    nodes: [
      { id: "start", type: "start", label: "Start", config: {}, next: ["notify-seller"] },
      { id: "notify-seller", type: "notification", label: "Notify Seller", config: { recipient: "seller" }, next: ["notify-buyer"] },
      { id: "notify-buyer", type: "email", label: "Email Buyer Receipt", config: { template: "order-receipt" }, next: ["end"] },
      { id: "end", type: "end", label: "End", config: {} },
    ],
  },
  {
    id: "tpl-seller-approval",
    name: "Seller Approval Chain",
    description: "Multi-step approval when a seller is approved",
    category: "marketplace",
    trigger: "seller-approved",
    tags: ["seller", "approval"],
    nodes: [
      { id: "start", type: "start", label: "Start", config: {}, next: ["admin-approval"] },
      { id: "admin-approval", type: "approval", label: "Admin Approval", config: { mode: "sequential", role: "workflow-admin" }, next: ["notify"] },
      { id: "notify", type: "notification", label: "Welcome Notification", config: {}, next: ["end"] },
      { id: "end", type: "end", label: "End", config: {} },
    ],
  },
  {
    id: "tpl-refund-approval",
    name: "Refund Approval",
    description: "Parallel approval for refund requests",
    category: "commerce",
    trigger: "refund-requested",
    tags: ["refunds", "approval"],
    nodes: [
      { id: "start", type: "start", label: "Start", config: {}, next: ["parallel-approval"] },
      {
        id: "parallel-approval",
        type: "approval",
        label: "Finance & Support Approval",
        config: { mode: "parallel", roles: ["workflow-admin", "workflow-operator"] },
        next: ["payment"],
      },
      { id: "payment", type: "payment", label: "Process Refund", config: { action: "refund" }, next: ["end"] },
      { id: "end", type: "end", label: "End", config: {} },
    ],
  },
  {
    id: "tpl-security-alert",
    name: "Security Alert Response",
    description: "Escalate and notify on security alerts",
    category: "security",
    trigger: "security-alert",
    tags: ["security", "incident"],
    nodes: [
      { id: "start", type: "start", label: "Start", config: {}, next: ["condition"] },
      {
        id: "condition",
        type: "condition",
        label: "Critical Severity?",
        config: { field: "severity", operator: "equals", value: "critical" },
        next: ["notify", "log"],
      },
      { id: "notify", type: "notification", label: "Critical Alert", config: { priority: "critical" }, next: ["end"] },
      { id: "log", type: "database", label: "Log Event", config: { table: "audit" }, next: ["end"] },
      { id: "end", type: "end", label: "End", config: {} },
    ],
  },
  {
    id: "tpl-cron-report",
    name: "Scheduled Analytics Report",
    description: "Cron-triggered daily report generation",
    category: "analytics",
    trigger: "cron",
    tags: ["cron", "reports"],
    nodes: baseNodes("Generate Report"),
  },
  {
    id: "tpl-webhook-sync",
    name: "Webhook Integration Sync",
    description: "Process inbound webhook and sync via HTTP",
    category: "integrations",
    trigger: "webhook",
    tags: ["webhook", "integrations"],
    nodes: [
      { id: "start", type: "start", label: "Start", config: {}, next: ["http"] },
      { id: "http", type: "http-request", label: "Sync External API", config: { method: "POST" }, next: ["queue"] },
      { id: "queue", type: "queue", label: "Enqueue Follow-up", config: {}, next: ["end"] },
      { id: "end", type: "end", label: "End", config: {} },
    ],
  },
];

export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return DEFAULT_WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

export function listWorkflowTemplates(category?: string): WorkflowTemplate[] {
  if (!category) return DEFAULT_WORKFLOW_TEMPLATES;
  return DEFAULT_WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

export function templateToWorkflow(template: WorkflowTemplate, owner: string): import("@/lib/enterprise-workflow-engine/types").WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id: `wf-${template.id}-${Date.now()}`,
    name: template.name,
    description: template.description,
    version: "1.0.0",
    status: "draft",
    trigger: template.trigger,
    nodes: template.nodes.map((n) => ({ ...n })),
    tags: [...template.tags],
    owner,
    createdAt: now,
    updatedAt: now,
    enabled: false,
    retryPolicy: { maxAttempts: 3, delayMs: 5000 },
    approvalRequired: template.nodes.some((n) => n.type === "approval"),
  };
}
