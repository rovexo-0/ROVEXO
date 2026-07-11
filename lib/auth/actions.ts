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
import { redirectAfterSignIn, sanitizeNextPath } from "@/lib/auth/redirects";
import { queueGaEvents, type QueuedGaEvent } from "@/lib/analytics/queue-ga-event";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { applySessionPersistence } from "@/lib/auth/session-cookies";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    terms: z.literal("on", { message: "Accept the Terms, Privacy Policy, and Cookie Policy." }),
    gdpr: z.literal("on", {
      message: "Confirm you understand how ROVEXO processes your personal data.",
    }),
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

function authCallbackUrl(next: string): string {
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(sanitizeNextPath(next))}`;
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
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms"),
    gdpr: formData.get("gdpr"),
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

  const { email, password, firstName, lastName } = parsed.data;
  const fullName = `${firstName} ${lastName}`.trim();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: authCallbackUrl("/account"),
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
    redirect("/account");
  }

  redirect("/verify-email?email=" + encodeURIComponent(email));
}

export async function signInWithOAuthProvider(formData: FormData): Promise<void> {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "apple") {
    return;
  }

  const next = sanitizeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: authCallbackUrl(next),
    },
  });

  if (error || !data.url) {
    return;
  }

  redirect(data.url);
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    await recordAuthRateLimitFailure("login", ip);
    return { error: mapAuthErrorMessage(error.message) };
  }

  await applySessionPersistence(formData.get("remember") === "on");

  await clearAuthRateLimit("login", ip);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return { error: "Unable to load your profile. Please try again." };
  }

  revalidatePath("/", "layout");

  await queueGaEvents([{ name: "login", params: { method: "email" } }]);

  const role = (profile?.role ?? "buyer") as UserRole;
  redirectAfterSignIn(role, formData.get("next")?.toString());
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

  if (!error && data.properties?.action_link) {
    await sendPasswordResetEmail({
      to: parsed.data.email,
      resetUrl: data.properties.action_link,
    });
  }

  return {
    success: "Check your email for a password reset link.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset session expired. Request a new password reset link." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: mapAuthErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/account");
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
      emailRedirectTo: authCallbackUrl("/account"),
    },
  });

  if (error) {
    return { error: mapAuthErrorMessage(error.message) };
  }

  return { success: "Verification email sent." };
}
