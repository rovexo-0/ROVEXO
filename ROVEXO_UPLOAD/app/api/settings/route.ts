import { NextResponse } from "next/server";
import { getAppSettings, updateAppSettings } from "@/lib/settings/store";
import { settingsPatchSchema } from "@/lib/account/schemas";
import { requireApiAuth } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const settings = await getAppSettings(auth.user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = settingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid settings." },
        { status: 400 },
      );
    }

    const settings = await updateAppSettings(auth.user.id, parsed.data);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }
}
