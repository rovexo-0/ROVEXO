/** Live password strength scoring for AUTH reset password (5-segment meter). */

export type PasswordStrengthResult = {
  score: number;
  label: string;
};

export function scoreResetPassword(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: "" };

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (score <= 2) return { score, label: "Weak" };
  if (score <= 3) return { score, label: "Fair" };
  if (score === 4) return { score, label: "Good" };
  return { score, label: "Strong" };
}

export function validateResetPasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must include a number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character.";
  }
  return null;
}
