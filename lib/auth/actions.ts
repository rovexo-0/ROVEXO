"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { UserRole } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  enforceAuthRequestRateLimit,
  recordAuthRateLimitFailure,
} from "@/lib/auth/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { getAppUrl } from "@/lib/supabase/env";
import { authCallbackUrl, redirectAfterSignIn, sanitizeNextPath } from "@/lib/auth/redirects";
import { queueGaEvents, type QueuedGaEvent } from "@/lib/analytics/queue-ga-event";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { validateResetPasswordStrength } from "@/lib/auth/password-strength";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { applySessionPersistence } from "@/lib/auth/session-cookies";
import { isPublicRegistrationEnabled } from "@/lib/launch-certification/private-mode";
import { mfaChallengeHref, readMfaAssurance } from "@/lib/auth/mfa";
import {
  authVerifyEmailRedirectUrl,
  isEmailConfirmationOtpType,
} from "@/lib/auth/email-verification-ux-v1";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";

/** Canonical Register consent = Terms (mandatory) + Marketing (optional). GDPR UI permanently removed (AUTH UI v1.2). */
const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    terms: z.literal("on", { message: "Accept the Terms, Privacy Policy, and Cookie Policy." }),
    marketing: z.enum(["on", "off"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const emailSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export type AuthActionState = {
  error?: string;
  success?: string;
};

/** Email confirmation landing — branded `/verify-email` (never Supabase hosted UI). */
function authEmailVerificationRedirectUrl(): string {
  return authVerifyEmailRedirectUrl(getAppUrl());
}

export type ConfirmEmailVerificationResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" };

/**
 * Token validation for email confirmation — same verifyOtp / exchangeCodeForSession
 * as `/auth/callback`, branded UX only. Never returns raw Supabase errors.
 */
export async function confirmEmailVerification(input: {
  tokenHash?: string | null;
  type?: string | null;
  code?: string | null;
}): Promise<ConfirmEmailVerificationResult> {
  const supabase = await createClient();
  const tokenHash = input.tokenHash?.trim() || null;
  const otpType = input.type?.trim() || null;
  const code = input.code?.trim() || null;

  if (tokenHash && otpType && isEmailConfirmationOtpType(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as "email" | "signup" | "invite" | "email_change",
    });
    if (error) {
      const normalized = error.message.toLowerCase();
      return {
        ok: false,
        reason: normalized.includes("expired") ? "expired" : "invalid",
      };
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const normalized = error.message.toLowerCase();
      return {
        ok: false,
        reason: normalized.includes("expired") ? "expired" : "invalid",
      };
    }
  } else {
    return { ok: false, reason: "invalid" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await syncAutoVerifiedProfile(user.id);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

async function clientIpFromHeaders(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headerStore.get("x-real-ip")?.trim() || "unknown";
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isPublicRegistrationEnabled()) {
    return {
      error:
        "Public registration is disabled during certification. Use an approved demo account.",
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms"),
    marketing: formData.get("marketing") === "on" ? "on" : "off",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data." };
  }

  const ip = await clientIpFromHeaders();
  const registerLimit = await checkAuthRateLimit("register", ip);
  if (!registerLimit.allowed) {
    return { error: "Too many registration attempts. Please try again later." };
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: authEmailVerificationRedirectUrl(),
    },
  });

  if (error) {
    await recordAuthRateLimitFailure("register", ip);
    return { error: mapAuthErrorMessage(error.message) };
  }

  if (!data.user) {
    await recordAuthRateLimitFailure("register", ip);
    return { error: "Unable to create account. Please try again." };
  }

  if (data.user.identities?.length === 0) {
    await recordAuthRateLimitFailure("register", ip);
    return { error: "An account with this email already exists." };
  }

  await clearAuthRateLimit("register", ip);

  const marketingOptIn = parsed.data.marketing === "on";
  const admin = createAdminClient();
  await admin.from("user_settings").upsert(
    {
      user_id: data.user.id,
      marketing_emails: marketingOptIn,
      email_notifications: true,
    },
    { onConflict: "user_id" },
  );

  const queuedEvents: QueuedGaEvent[] = [
    { name: "register", params: { method: "email" } },
    { name: "sign_up", params: { method: "email" } },
  ];
  await queueGaEvents(queuedEvents);

  if (data.session) {
    redirect("/");
  }

  redirect("/verify-email?email=" + encodeURIComponent(email));
}

export async function signInWithOAuthProvider(formData: FormData): Promise<void> {
  const provider = formData.get("provider");
  const returnPathRaw = formData.get("returnPath")?.toString() ?? "/login";
  const returnPath =
    returnPathRaw === "/register" || returnPathRaw.startsWith("/register?")
      ? "/register"
      : "/login";

  if (provider !== "google" && provider !== "apple") {
    // Facebook and unknown providers stay blocked on public RC1.
    redirect(`${returnPath}?error=oauth_provider_unavailable`);
  }

  const next = sanitizeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();

  let data: { url: string } | null = null;
  let error: { message: string } | null = null;
  try {
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: authCallbackUrl(next),
        skipBrowserRedirect: false,
      },
    });
    data = result.data.url ? { url: result.data.url } : null;
    error = result.error;
  } catch {
    redirect(
      `${returnPath}?error=oauth_network${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`,
    );
  }

  if (error || !data?.url) {
    const message = (error?.message ?? "").toLowerCase();
    let code = "oauth_provider_unavailable";
    if (message.includes("cancel")) code = "oauth_cancelled";
    if (
      message.includes("already") ||
      message.includes("identity") ||
      message.includes("registered")
    ) {
      code = "oauth_account_exists";
    }
    if (message.includes("network") || message.includes("fetch")) code = "oauth_network";
    const nextQs = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`${returnPath}?error=${code}${nextQs}`);
  }

  redirect(data.url);
}

/** FORENSIC ONLY — login pipeline timing. Does not alter control flow. */
let signInWithPasswordCallCount = 0;

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const loginTraceId = `LOGIN-TRACE-${Date.now()}`;
  const loginTotalT0 = Date.now();
  signInWithPasswordCallCount = 0;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const ip = await clientIpFromHeaders();
  const loginLimit = await checkAuthRateLimit("login", ip);
  if (!loginLimit.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const supabase = await createClient();

  const T0 = Date.now();
  console.info(`[${loginTraceId}] signInWithPassword START T0=${T0}`);
  signInWithPasswordCallCount += 1;
  const callNumber = signInWithPasswordCallCount;
  let passwordGrantError: unknown = null;
  let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["data"] | undefined;
  let error: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["error"] | undefined;
  try {
    const result = await supabase.auth.signInWithPassword(parsed.data);
    data = result.data;
    error = result.error;
  } catch (thrown) {
    passwordGrantError = thrown;
    throw thrown;
  } finally {
    const T1 = Date.now();
    const elapsed = T1 - T0;
    console.info(
      `[${loginTraceId}] signInWithPassword END T1=${T1} elapsed=${elapsed}ms call#=${callNumber} totalCallsThisSignIn=${signInWithPasswordCallCount}`,
    );
    if (elapsed > 5000) {
      console.info(
        `[${loginTraceId}] signInWithPassword SLOW detail requestStart=${T0} responseFinished=${T1} thrown=${
          passwordGrantError ? String(passwordGrantError) : "none"
        } sdkError=${error?.message ?? "none"} retryCount=0(app) abortCount=0(app)`,
      );
    }
  }

  if (error) {
    await recordAuthRateLimitFailure("login", ip);
    console.info(
      `[${loginTraceId}] TOTAL_LOGIN ${Date.now() - loginTotalT0}ms (failed auth) callCount=${signInWithPasswordCallCount}`,
    );
    return { error: mapAuthErrorMessage(error.message) };
  }

  const persistT0 = Date.now();
  await applySessionPersistence(formData.get("remember") === "on");
  console.info(`[${loginTraceId}] applySessionPersistence ${Date.now() - persistT0}ms`);

  await clearAuthRateLimit("login", ip);

  const profileT0 = Date.now();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data!.user!.id)
    .maybeSingle();
  console.info(`[${loginTraceId}] profiles.select(role) ${Date.now() - profileT0}ms`);

  if (profileError) {
    console.info(
      `[${loginTraceId}] TOTAL_LOGIN ${Date.now() - loginTotalT0}ms (profile error) callCount=${signInWithPasswordCallCount}`,
    );
    return { error: "Unable to load your profile. Please try again." };
  }

  revalidatePath("/", "layout");

  await queueGaEvents([{ name: "login", params: { method: "email" } }]);

  const nextPath = formData.get("next")?.toString();
  const mfaAssurance = await readMfaAssurance(supabase);
  if (mfaAssurance.requiresChallenge) {
    console.info(`[${loginTraceId}] MFA challenge required — redirecting`);
    redirect(mfaChallengeHref(nextPath));
  }

  const role = (profile?.role ?? "buyer") as UserRole;
  const redirectT0 = Date.now();
  console.info(`[${loginTraceId}] redirectAfterSignIn START`);
  try {
    redirectAfterSignIn(role, nextPath);
  } finally {
    // redirectAfterSignIn throws NEXT_REDIRECT — finish is throw time
    console.info(`[${loginTraceId}] redirectAfterSignIn ${Date.now() - redirectT0}ms`);
    console.info(
      `[${loginTraceId}] TOTAL_LOGIN ${Date.now() - loginTotalT0}ms callCount=${signInWithPasswordCallCount}`,
    );
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const ip = await clientIpFromHeaders();
  const resetLimit = await enforceAuthRequestRateLimit("reset", ip);
  if (!resetLimit.allowed) {
    return { error: "Too many reset attempts. Please try again later." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
    options: {
      redirectTo: authCallbackUrl("/reset-password"),
    },
  });

  if (error) {
    const rawMessage = typeof error.message === "string" ? error.message : "";
    const normalized = rawMessage.toLowerCase();
    if (normalized.includes("not found") || normalized.includes("no user")) {
      return { error: "No account found for that email address." };
    }
    if (normalized.includes("rate limit")) {
      return { error: "Too many reset attempts. Please try again later." };
    }
    // mapAuthErrorMessage returns "" for "{}" / empty / "[object Object]" so fallback always wins.
    return {
      error:
        mapAuthErrorMessage(error.message) ||
        "Unable to send reset link. Please try again.",
    };
  }

  if (!data.properties?.action_link) {
    return { error: "Unable to send reset link. Please try again." };
  }

  try {
    await sendPasswordResetEmail({
      to: parsed.data.email,
      resetUrl: data.properties.action_link,
    });
  } catch {
    return { error: "Unable to send reset link. Please try again." };
  }

  return {
    success: "Check your email for a password reset link.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const resetCopy = AUTH_MASTER_SPEC.resetPassword.copy;
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const updateLimit = await enforceAuthRequestRateLimit("update-password", ip);
  if (!updateLimit.allowed) {
    return { error: resetCopy.errors.tooManyRequests };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: resetCopy.errors.weakPassword };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: resetCopy.errors.passwordsMismatch };
  }

  const strengthError = validateResetPasswordStrength(parsed.data.password);
  if (strengthError) {
    return { error: strengthError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: resetCopy.errors.invalidToken };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("expired")) {
      return { error: resetCopy.errors.expiredToken };
    }
    if (normalized.includes("session") || normalized.includes("invalid")) {
      return { error: resetCopy.errors.invalidToken };
    }
    const mapped = mapAuthErrorMessage(error.message);
    if (mapped.toLowerCase().includes("too many")) {
      return { error: resetCopy.errors.tooManyRequests };
    }
    if (
      mapped.toLowerCase().includes("password") &&
      (mapped.toLowerCase().includes("weak") ||
        mapped.toLowerCase().includes("character") ||
        mapped.toLowerCase().includes("uppercase"))
    ) {
      return { error: resetCopy.errors.weakPassword };
    }
    return {
      error:
        mapped && mapped !== error.message
          ? mapped
          : resetCopy.errors.serverUnavailable,
    };
  }

  await supabase.auth.signOut();
  // Do not revalidatePath here: a layout refresh remounts /reset-password without a
  // session and replaces the success UI with the "Invalid link" empty state.

  return {
    success: "Password updated successfully.",
  };
}

export async function resendVerificationEmail(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const ip = await clientIpFromHeaders();
  const resendLimit = await enforceAuthRequestRateLimit("verify-resend", ip);
  if (!resendLimit.allowed) {
    return { error: "Too many verification requests. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: authEmailVerificationRedirectUrl(),
    },
  });

  if (error) {
    return { error: mapAuthErrorMessage(error.message) };
  }

  return { success: "Verification email sent." };
}
