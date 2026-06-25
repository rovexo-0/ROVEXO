import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { getProfileDetails, updateProfileDetails } from "@/lib/profile/service";
import { profileUpdateSchema } from "@/lib/account/schemas";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const profile = await getProfileDetails(auth.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile data." },
        { status: 400 },
      );
    }

    const profile = await updateProfileDetails(auth.user.id, parsed.data);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
