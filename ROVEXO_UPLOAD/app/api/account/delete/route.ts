import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/account/delete-account";
import { requireApiAuth, getUserRole } from "@/lib/auth/session";

export async function POST() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const role = await getUserRole(auth.user.id);
  if (!role) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  try {
    await deleteUserAccount(auth.user.id, role);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete account." },
      { status: 400 },
    );
  }
}
