import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";

export type OpsLogLevel = "info" | "warn" | "error";

export type OpsLogCategory =
  | "api"
  | "payment"
  | "auth"
  | "storage"
  | "unhandled"
  | "admin"
  | "cron"
  | "email";

type LogOpsEventInput = {
  level?: OpsLogLevel;
  category: OpsLogCategory;
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
};

function serializeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export async function logOpsEvent(input: LogOpsEventInput): Promise<void> {
  const level = input.level ?? "error";
  const serialized = input.error ? serializeError(input.error) : null;
  const message = serialized?.message ? `${input.message}: ${serialized.message}` : input.message;

  if (process.env.NODE_ENV !== "production") {
    const prefix = `[${level.toUpperCase()}][${input.category}]`;
    if (level === "error") {
      console.error(prefix, message, input.context ?? {});
    } else if (level === "warn") {
      console.warn(prefix, message, input.context ?? {});
    } else {
      console.info(prefix, message, input.context ?? {});
    }
  }

  if (level === "info" && process.env.NODE_ENV === "production") {
    return;
  }

  try {
    const admin = createAdminClient();
    await admin.from("platform_error_logs").insert({
      level,
      category: input.category,
      message,
      context: (input.context ?? {}) as Json,
      stack_trace: serialized?.stack ?? null,
    });
  } catch {
    // Logging must never block primary flows.
  }
}

export function logApiError(message: string, error: unknown, context?: Record<string, unknown>) {
  void logOpsEvent({ category: "api", message, error, context });
}

export function logPaymentError(message: string, error: unknown, context?: Record<string, unknown>) {
  void logOpsEvent({ category: "payment", message, error, context });
}

export function logAuthError(message: string, error: unknown, context?: Record<string, unknown>) {
  void logOpsEvent({ category: "auth", message, error, context });
}

export function logStorageError(message: string, error: unknown, context?: Record<string, unknown>) {
  void logOpsEvent({ category: "storage", message, error, context });
}

export function logCronEvent(message: string, context?: Record<string, unknown>, level: OpsLogLevel = "info") {
  void logOpsEvent({ category: "cron", message, context, level });
}
