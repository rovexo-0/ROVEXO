/**
 * ROVEXO RC1 — Command Centre infrastructure service classification.
 *
 * STATUS: MASTER CODE FREEZE ACTIVE · FAIL CLOSED FOR REQUIRED SERVICES
 *
 * Dashboard must never show Unhealthy/ERROR for intentionally disabled
 * optional integrations. Missing optional config → Not Configured only.
 */

export const RC1_REQUIRED_INFRA_SERVICES = [
  "api",
  "database",
  "storage",
  "authentication",
  "stripe",
] as const;

export const RC1_OPTIONAL_INFRA_SERVICES = [
  "redis",
  "queue",
  "email",
  "cron",
  "push",
  "sendcloud",
  "monitoring",
] as const;

export type Rc1RequiredInfraService = (typeof RC1_REQUIRED_INFRA_SERVICES)[number];
export type Rc1OptionalInfraService = (typeof RC1_OPTIONAL_INFRA_SERVICES)[number];

export const RC1_INFRASTRUCTURE_CLASSIFICATION_V1 = {
  id: "rc1-infrastructure-classification-v1",
  version: "1.0.0-rc.1",
  required: RC1_REQUIRED_INFRA_SERVICES,
  optional: RC1_OPTIONAL_INFRA_SERVICES,
  notes: {
    redis: "Optional for RC1 — in-memory rate-limit fallback on localhost; configure Upstash before live www fail-closed traffic.",
    email: "Optional for RC1 — live Resend matrix deferred (KI-005).",
    cron: "Optional for RC1 — scheduled jobs Owner-ops pending.",
    push: "Optional for RC1 — device permission certification pending (KI-003).",
    sendcloud: "Optional until shipping provider credentials are Owner-enabled.",
    queue: "Follows Redis — Not Configured when Redis is absent.",
    monitoring: "Derived from real health checks; synthetic CPU/RAM must not drive service ERROR.",
  },
} as const;
