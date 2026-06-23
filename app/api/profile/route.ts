import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    profile: {
      fullName: data?.full_name ?? "Account",
      avatarUrl: data?.avatar_url ?? null,
    },
  });
}
