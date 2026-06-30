import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/session";

export async function POST() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: auth.user.email ?? "",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
