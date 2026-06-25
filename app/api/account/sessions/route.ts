import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return NextResponse.json({ error: "Unable to load session." }, { status: 500 });
  }

  const session = data.session;
  return NextResponse.json({
    current: {
      id: session.access_token.slice(0, 12),
      createdAt: session.user.created_at,
      lastSignInAt: session.user.last_sign_in_at,
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      provider: session.user.app_metadata.provider ?? "email",
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { action?: string };
  if (body.action !== "sign_out_others") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });

  if (error) {
    return NextResponse.json({ error: "Unable to sign out other sessions." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
