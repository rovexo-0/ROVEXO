import { analyzeMessageContent } from "@/lib/moderation/analyzer";
import type { ModerationResult } from "@/lib/moderation/types";

export type MessageSecurityWarning = {
  blocked: boolean;
  warning: string | null;
  result: ModerationResult;
};

export function inspectMessageContent(content: string): MessageSecurityWarning {
  const result = analyzeMessageContent(content);

  if (result.decision === "blocked") {
    return {
      blocked: true,
      warning: result.summary,
      result,
    };
  }

  if (result.decision === "warning") {
    return {
      blocked: false,
      warning: result.summary,
      result,
    };
  }

  return { blocked: false, warning: null, result };
}

export function buildAutoReplyWarning(warning: string | null): string | null {
  if (!warning) return null;
  return `ROVEXO safety notice: ${warning} Keep payments and communication on ROVEXO for buyer protection.`;
}
