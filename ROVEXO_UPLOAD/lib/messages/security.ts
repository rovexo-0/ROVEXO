import { analyzeMessageContent } from "@/lib/moderation/analyzer";
import { buildMessageSecurityNotice } from "@/lib/moderation/user-messages";
import type { ModerationResult } from "@/lib/moderation/types";

export type MessageSecurityWarning = {
  blocked: boolean;
  warning: string | null;
  result: ModerationResult;
};

export function inspectMessageContent(content: string): MessageSecurityWarning {
  const result = analyzeMessageContent(content);
  const userMessage = buildMessageSecurityNotice(result);

  if (result.decision === "blocked") {
    return {
      blocked: true,
      warning: userMessage,
      result,
    };
  }

  if (result.decision === "warning") {
    return {
      blocked: false,
      warning: userMessage,
      result,
    };
  }

  return { blocked: false, warning: null, result };
}

export function buildAutoReplyWarning(warning: string | null): string | null {
  if (!warning) return null;
  return `${warning} Keep payments and communication on ROVEXO for buyer protection.`;
}
