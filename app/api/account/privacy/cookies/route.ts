import { cookiePreferencesPatchSchema } from "@/lib/account/schemas";
import { getPrivacyEngine, updateCookiePreferences } from "@/lib/settings/store";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { cookies } = await getPrivacyEngine(auth.user.id);
  return NextResponse.json({ cookies });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = cookiePreferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid cookie preferences." },
        { status: 400 },
      );
    }

    const cookies = await updateCookiePreferences(auth.user.id, parsed.data);
    return NextResponse.json({ cookies });
  } catch {
    return NextResponse.json({ error: "Unable to update cookie preferences." }, { status: 500 });
  }
}
