import type { PostgrestError } from "@supabase/supabase-js";

const PERMISSION_DENIED_PATTERN = /permission denied/i;

export function isDatabasePermissionError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return PERMISSION_DENIED_PATTERN.test(error.message);
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return PERMISSION_DENIED_PATTERN.test(String((error as PostgrestError).message));
  }
  return PERMISSION_DENIED_PATTERN.test(String(error));
}

export const DATABASE_PERMISSION_ERROR = "database permission error";
