import { privacyPatchSchema } from "@/lib/account/schemas";
import { getAppSettings, updatePrivacySettings } from "@/lib/settings/store";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const settings = await getAppSettings(auth.user.id);
  return NextResponse.json({
    privacy: {
      profileVisibility: settings.profileVisibility,
      marketingEmails: settings.marketingEmails,
      showActivityStatus: settings.showActivityStatus,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = privacyPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid privacy settings." },
        { status: 400 },
      );
    }

    const settings = await updatePrivacySettings(auth.user.id, parsed.data);
    return NextResponse.json({
      privacy: {
        profileVisibility: settings.profileVisibility,
        marketingEmails: settings.marketingEmails,
        showActivityStatus: settings.showActivityStatus,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to update privacy settings." }, { status: 500 });
  }
}
