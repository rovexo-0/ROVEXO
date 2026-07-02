import { cookies } from "next/headers";

const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isSupabaseAuthCookie(name: string): boolean {
  return name.includes("-auth-token");
}

/**
 * Applies remember-me preference to Supabase auth cookies after sign-in.
 * Checked: persistent session (30 days). Unchecked: browser session cookie.
 */
export async function applySessionPersistence(remember: boolean): Promise<void> {
  const cookieStore = await cookies();

  for (const cookie of cookieStore.getAll()) {
    if (!isSupabaseAuthCookie(cookie.name)) continue;

    cookieStore.set(cookie.name, cookie.value, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      ...(remember ? { maxAge: REMEMBER_ME_MAX_AGE_SECONDS } : {}),
    });
  }
}
