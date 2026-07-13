import type { Metadata, Viewport } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  ResetPasswordScreen,
  type ResetPasswordTokenState,
} from "@/features/auth/components/ResetPasswordScreen";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function resolveTokenState(
  hasSession: boolean,
  error?: string,
): ResetPasswordTokenState {
  if (hasSession) return "valid";
  return error === "expired" ? "expired" : "invalid";
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ResetPasswordScreen tokenState={resolveTokenState(Boolean(user), error)} />
  );
}
