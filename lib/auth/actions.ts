"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { getAppUrl } from "@/lib/supabase/env";
import { redirectPathForRole, sanitizeNextPath } from "@/lib/auth/redirects";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  role: z.enum(["buyer", "seller", "business"]).default("buyer"),
  businessName: z.string().optional(),
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
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    username: String(formData.get("username") ?? "").toLowerCase(),
    role: formData.get("role") ?? "buyer",
    businessName: formData.get("businessName") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data." };
  }

  const ip = await clientIpFromHeaders();
  const registerLimit = await checkRateLimit(`auth-register:${ip}`, 5, 15 * 60_000);
  if (!registerLimit.allowed) {
    return { error: "Too many registration attempts. Please try again later." };
  }

  const { email, password, fullName, username, role, businessName } = parsed.data;
  const supabase = await createClient();

  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return { error: "Username is already taken." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authCallbackUrl("/account"),
      data: {
        full_name: fullName,
        username,
        role,
        business_name: businessName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Unable to create account. Please try again." };
  }

  if (data.user.identities?.length === 0) {
    return { error: "An account with this email already exists." };
  }

  if (data.session) {
    redirect(redirectPathForRole(role));
  }

  redirect("/verify-email?email=" + encodeURIComponent(email));
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
  const loginLimit = await checkRateLimit(`auth-login:${ip}`, 10, 15 * 60_000);
  if (!loginLimit.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return { error: "Unable to load your profile. Please try again." };
  }

  revalidatePath("/", "layout");

  const next = formData.get("next")?.toString();
  if (next) {
    redirect(sanitizeNextPath(next));
  }

  redirect(redirectPathForRole(profile?.role ?? "buyer"));
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
  const resetLimit = await checkRateLimit(`auth-reset:${ip}`, 5, 15 * 60_000);
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
    return { error: error.message };
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

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: authCallbackUrl("/account"),
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Verification email sent." };
}
