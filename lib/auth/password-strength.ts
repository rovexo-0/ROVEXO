/** Live password strength scoring for AUTH reset password (5-segment meter). */

import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";

export type PasswordRequirementId =
  | "minLength"
  | "uppercase"
  | "lowercase"
  | "number"
  | "special";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

export type PasswordStrengthResult = {
  score: number;
  label: string;
};

const STRENGTH_LABELS = AUTH_MASTER_SPEC.resetPassword.copy.strengthLabels;

export function getResetPasswordRequirements(password: string): PasswordRequirement[] {
  const { checklist } = AUTH_MASTER_SPEC.resetPassword.copy;

  return [
    { id: "minLength", label: checklist.minLength, met: password.length >= 8 },
    { id: "uppercase", label: checklist.uppercase, met: /[A-Z]/.test(password) },
    { id: "lowercase", label: checklist.lowercase, met: /[a-z]/.test(password) },
    { id: "number", label: checklist.number, met: /\d/.test(password) },
    { id: "special", label: checklist.special, met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function scoreResetPassword(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: "" };

  const metCount = getResetPasswordRequirements(password).filter((item) => item.met).length;

  if (metCount <= 1) return { score: 1, label: STRENGTH_LABELS.veryWeak };
  if (metCount === 2) return { score: 2, label: STRENGTH_LABELS.weak };
  if (metCount === 3) return { score: 3, label: STRENGTH_LABELS.medium };
  if (metCount === 4) return { score: 4, label: STRENGTH_LABELS.strong };
  return { score: 5, label: STRENGTH_LABELS.excellent };
}

export function validateResetPasswordStrength(password: string): string | null {
  const requirements = getResetPasswordRequirements(password);
  if (requirements.every((item) => item.met)) return null;

  return AUTH_MASTER_SPEC.resetPassword.copy.errors.weakPassword;
}

export function mapResetPasswordClientError(
  message: string | null | undefined,
): string | null {
  if (!message) return null;

  const { errors } = AUTH_MASTER_SPEC.resetPassword.copy;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("do not match") ||
    normalized.includes("passwords don't match")
  ) {
    return errors.passwordsMismatch;
  }
  if (
    normalized.includes("strength") ||
    normalized.includes("uppercase") ||
    normalized.includes("lowercase") ||
    normalized.includes("special character") ||
    normalized.includes("8 characters") ||
    normalized.includes("number")
  ) {
    return errors.weakPassword;
  }
  if (normalized.includes("expired")) return errors.expiredToken;
  if (normalized.includes("invalid") && normalized.includes("link")) {
    return errors.invalidToken;
  }
  if (normalized.includes("offline")) return errors.offline;
  if (normalized.includes("too many")) return errors.tooManyRequests;
  if (
    normalized.includes("unable to reset") ||
    normalized.includes("try again shortly") ||
    normalized.includes("server")
  ) {
    return errors.serverUnavailable;
  }

  return errors.unknown;
}
