import { existsSync } from "node:fs";
import { join } from "node:path";
import type { HealthStatus } from "@/lib/ops/health-types";

export type EnvValidationItem = {
  key: string;
  group: string;
  required: boolean;
  configured: boolean;
  status: HealthStatus | "optional";
  message: string;
};

export type ProductionEnvironmentReport = {
  pass: boolean;
  productionReady: boolean;
  configuredCount: number;
  requiredCount: number;
  missingRequired: string[];
  warnings: string[];
  items: EnvValidationItem[];
  timestamp: string;
};

type EnvSpec = {
  key: string;
  group: string;
  required: boolean;
  aliases?: string[];
  validate?: (value: string) => string | null;
};

function readEnv(key: string, aliases: string[] = []): string | undefined {
  for (const name of [key, ...aliases]) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).protocol === "https:";
  } catch {
    return false;
  }
}

const ENV_SPECS: EnvSpec[] = [
  {
    key: "NEXT_PUBLIC_APP_URL",
    group: "App",
    required: true,
    validate: (value) => (isHttpsUrl(value) ? null : "Must be a valid HTTPS URL"),
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    group: "App",
    required: false,
    validate: (value) => (isHttpsUrl(value) ? null : "Must be a valid HTTPS URL when set"),
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    group: "Supabase",
    required: true,
    aliases: ["SUPABASE_URL"],
    validate: (value) => (value.includes(".supabase.co") ? null : "Must be a Supabase project URL"),
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    group: "Supabase",
    required: true,
    aliases: ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    group: "Supabase",
    required: true,
    aliases: ["SUPABASE_SECRET_KEY"],
  },
  {
    key: "STRIPE_SECRET_KEY",
    group: "Stripe",
    required: true,
    validate: (value) =>
      value.startsWith("sk_live_") || value.startsWith("sk_test_")
        ? value.startsWith("sk_live_") || process.env.NODE_ENV !== "production"
          ? null
          : "Production requires sk_live_ Stripe key"
        : "Invalid Stripe secret key format",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    group: "Stripe",
    required: true,
    validate: (value) => (value.startsWith("whsec_") ? null : "Invalid Stripe webhook secret format"),
  },
  {
    key: "RESEND_API_KEY",
    group: "Email",
    required: true,
    validate: (value) => (value.startsWith("re_") ? null : "Invalid Resend API key format"),
  },
  {
    key: "EMAIL_FROM",
    group: "Email",
    required: true,
  },
  {
    key: "UPSTASH_REDIS_REST_URL",
    group: "Redis",
    required: true,
    aliases: ["REDIS_URL"],
    validate: (value) => (value.startsWith("https://") ? null : "Redis REST URL must use HTTPS"),
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    group: "Redis",
    required: true,
    aliases: ["REDIS_TOKEN"],
  },
  {
    key: "CRON_SECRET",
    group: "Cron",
    required: true,
    validate: (value) => (value.length >= 16 ? null : "CRON_SECRET should be at least 16 characters"),
  },
  {
    key: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    group: "Analytics",
    required: true,
    validate: (value) => (value.startsWith("G-") ? null : "GA4 measurement ID must start with G-"),
  },
  {
    key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    group: "Push",
    required: false,
  },
  {
    key: "VAPID_PRIVATE_KEY",
    group: "Push",
    required: false,
  },
  {
    key: "VAPID_SUBJECT",
    group: "Push",
    required: false,
    validate: (value) => (value.startsWith("mailto:") ? null : "VAPID subject should be mailto: address"),
  },
];

function fileExists(relativePath: string): boolean {
  return existsSync(join(process.cwd(), relativePath));
}

export function validateProductionEnvironment(): ProductionEnvironmentReport {
  const items: EnvValidationItem[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  for (const spec of ENV_SPECS) {
    const value = readEnv(spec.key, spec.aliases);
    const configured = Boolean(value);
    let message = configured ? "Configured" : spec.required ? "Missing" : "Optional — not configured";
    let status: EnvValidationItem["status"] = configured ? "healthy" : spec.required ? "unhealthy" : "optional";

    if (configured && value && spec.validate) {
      const validationError = spec.validate(value);
      if (validationError) {
        message = validationError;
        status = spec.required ? "unhealthy" : "degraded";
        warnings.push(`${spec.key}: ${validationError}`);
      }
    }

    if (!configured && spec.required) {
      missingRequired.push(spec.key);
    }

    items.push({
      key: spec.key,
      group: spec.group,
      required: spec.required,
      configured,
      status,
      message,
    });
  }

  const pushPublic = readEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const pushPrivate = readEnv("VAPID_PRIVATE_KEY");
  if ((pushPublic && !pushPrivate) || (!pushPublic && pushPrivate)) {
    warnings.push("Push configuration incomplete — both VAPID public and private keys are required for web push.");
  }

  const requiredCount = ENV_SPECS.filter((spec) => spec.required).length;
  const configuredRequired = items.filter((item) => item.required && item.configured && item.status !== "unhealthy").length;
  const pass = missingRequired.length === 0 && items.every((item) => !item.required || item.status !== "unhealthy");

  return {
    pass,
    productionReady: pass && warnings.filter((w) => w.includes("sk_live_")).length === 0,
    configuredCount: configuredRequired,
    requiredCount,
    missingRequired,
    warnings,
    items,
    timestamp: new Date().toISOString(),
  };
}

export function validatePlatformSecuritySurface(): {
  pass: boolean;
  checks: Array<{ id: string; pass: boolean; message: string }>;
} {
  const checks = [
    {
      id: "middleware",
      pass: fileExists("middleware.ts") && fileExists("lib/supabase/middleware.ts"),
      message: "Auth middleware and Supabase session refresh active",
    },
    {
      id: "rate-limit",
      pass: fileExists("lib/api/rate-limit.ts"),
      message: "API rate limiting module present",
    },
    {
      id: "csrf-guard",
      pass: fileExists("lib/api/csrf-guard.ts"),
      message: "Same-origin CSRF guard for mutation APIs",
    },
    {
      id: "stripe-webhook",
      pass: fileExists("app/api/stripe/webhook/route.ts") && fileExists("app/api/webhooks/stripe/route.ts"),
      message: "Stripe webhook signature verification routes present",
    },
    {
      id: "cron-auth",
      pass: fileExists("lib/cron/auth.ts"),
      message: "Cron bearer authorization configured",
    },
    {
      id: "rls",
      pass: fileExists("supabase/migrations/20250618000002_rls_policies.sql"),
      message: "Supabase RLS policy migrations present",
    },
    {
      id: "security-headers",
      pass: fileExists("lib/ops/security-headers.ts"),
      message: "Centralized security header configuration",
    },
  ];

  return {
    pass: checks.every((check) => check.pass),
    checks,
  };
}
