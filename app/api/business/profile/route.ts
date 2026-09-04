import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  businessInformationSchema,
  loadBusinessStatus,
  persistBusinessInformation,
} from "@/lib/business/business-onboarding-v1";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const status = await loadBusinessStatus(auth.user.id);
    return NextResponse.json({ profile: status.profile, status });
  } catch {
    return NextResponse.json({ error: "Unable to load business information." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = businessInformationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid business information." },
        { status: 400 },
      );
    }

    const saved = await persistBusinessInformation(auth.user.id, parsed.data);
    const status = await loadBusinessStatus(auth.user.id);
    return NextResponse.json({
      success: true,
      profile: saved.profile,
      status,
      verified: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save business information.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
