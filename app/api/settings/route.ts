import { NextResponse } from "next/server";
import { getAppSettings, updateAppSettings } from "@/lib/settings/store";
import type { AppSettingsPatch } from "@/lib/settings/types";
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
    const body = (await request.json()) as AppSettingsPatch;
    const settings = await updateAppSettings(auth.user.id, body);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }
}
