import { unblockUser } from "@/lib/account/blocked-users";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    await unblockUser(auth.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to unblock user." }, { status: 500 });
  }
}
