import { blockUserByUsername, listBlockedUsers } from "@/lib/account/blocked-users";
import { blockUsernameSchema } from "@/lib/account/schemas";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const blocked = await listBlockedUsers(auth.user.id);
    return NextResponse.json({ blocked });
  } catch {
    return NextResponse.json({ error: "Unable to load blocked users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = blockUsernameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid username." },
        { status: 400 },
      );
    }

    const blocked = await blockUserByUsername(auth.user.id, parsed.data.username);
    return NextResponse.json({ blocked });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to block user." },
      { status: 400 },
    );
  }
}
