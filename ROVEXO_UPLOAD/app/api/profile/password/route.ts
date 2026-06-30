import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/session";
import { passwordChangeSchema } from "@/lib/account/schemas";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password data." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: auth.user.email ?? "",
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
