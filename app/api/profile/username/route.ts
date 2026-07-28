import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { usernameSchema } from "@/lib/account/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/profile/username?username=
 * Instant availability check for Account Settings v1.0 (no schema change).
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase() ?? "";
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return NextResponse.json({
      available: false,
      reason: parsed.error.issues[0]?.message ?? "Invalid username",
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data)
    .neq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { available: false, reason: "Some information is temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    available: !data,
    reason: data ? "Username is unavailable" : null,
  });
}
