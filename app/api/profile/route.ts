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
    .select("id, email, role, full_name, avatar_url")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      email: data.email,
      role: data.role,
      fullName: data.full_name,
      avatarUrl: data.avatar_url ?? null,
    },
  });
}
