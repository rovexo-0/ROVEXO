import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  resolveProfileCompletionRedirect,
  sanitizeReturnToPath,
  type ProfileCompletionIntent,
} from "@/lib/account/profile-completion";

const INTENTS: ProfileCompletionIntent[] = ["checkout", "publish", "withdraw"];

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const intentParam = searchParams.get("intent");
  const intent = INTENTS.includes(intentParam as ProfileCompletionIntent)
    ? (intentParam as ProfileCompletionIntent)
    : null;

  if (!intent) {
    return NextResponse.json({ error: "Invalid intent." }, { status: 400 });
  }

  const returnTo = sanitizeReturnToPath(searchParams.get("returnTo"), "/account");
  const redirect = await resolveProfileCompletionRedirect(auth.user.id, intent, returnTo);

  return NextResponse.json({ redirect });
}
