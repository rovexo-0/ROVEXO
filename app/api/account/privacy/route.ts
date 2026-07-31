import { privacyPatchSchema } from "@/lib/account/schemas";
import { getPrivacyEngine, updatePrivacyEngine } from "@/lib/settings/store";
import { privacyEngineToLegacy } from "@/lib/privacy/privacy-engine-v1";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { privacy, cookies } = await getPrivacyEngine(auth.user.id);
  const legacy = privacyEngineToLegacy(privacy);
  return NextResponse.json({
    privacy: {
      ...legacy,
      whoCanViewProfile: privacy.whoCanViewProfile,
      switches: privacy.switches,
      engine: privacy,
    },
    cookies,
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

    const privacy = await updatePrivacyEngine(auth.user.id, {
      switchId: parsed.data.switchId,
      switchEnabled: parsed.data.switchEnabled,
      whoCanViewProfile: parsed.data.whoCanViewProfile ?? parsed.data.profileVisibility,
      engine: parsed.data.engine,
    });
    const legacy = privacyEngineToLegacy(privacy);

    // Support legacy full-object saves (activity + marketing + visibility together).
    if (
      parsed.data.marketingEmails !== undefined ||
      parsed.data.showActivityStatus !== undefined ||
      parsed.data.profileVisibility !== undefined
    ) {
      const next = await updatePrivacyEngine(auth.user.id, {
        whoCanViewProfile: parsed.data.profileVisibility ?? privacy.whoCanViewProfile,
        engine: {
          ...privacy,
          whoCanViewProfile: parsed.data.profileVisibility ?? privacy.whoCanViewProfile,
          switches: {
            ...privacy.switches,
            ...(parsed.data.marketingEmails !== undefined
              ? { marketingEmails: parsed.data.marketingEmails }
              : {}),
            ...(parsed.data.showActivityStatus !== undefined
              ? {
                  showOnlineStatus: parsed.data.showActivityStatus,
                  showLastSeen: parsed.data.showActivityStatus,
                }
              : {}),
          },
        },
      });
      const nextLegacy = privacyEngineToLegacy(next);
      return NextResponse.json({
        privacy: {
          ...nextLegacy,
          whoCanViewProfile: next.whoCanViewProfile,
          switches: next.switches,
          engine: next,
        },
      });
    }

    return NextResponse.json({
      privacy: {
        ...legacy,
        whoCanViewProfile: privacy.whoCanViewProfile,
        switches: privacy.switches,
        engine: privacy,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to update privacy settings." }, { status: 500 });
  }
}
