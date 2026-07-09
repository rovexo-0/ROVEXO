import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserAccount } from "@/lib/account/delete-account";
import { getAccountDeletionEligibility } from "@/lib/account/deletion-eligibility";
import { requireApiAuth, getUserRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const deleteSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const eligibility = await getAccountDeletionEligibility(auth.user.id);
  return NextResponse.json(eligibility);
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const role = await getUserRole(auth.user.id);
  if (!role) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const email = auth.user.email;
  if (!email) {
    return NextResponse.json({ error: "Unable to verify password." }, { status: 400 });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (signInError) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const eligibility = await getAccountDeletionEligibility(auth.user.id);
  if (!eligibility.canDelete) {
    return NextResponse.json(
      {
        error:
          "Your account cannot be deleted until all active activity has been completed.",
        blockers: eligibility.blockers,
      },
      { status: 409 },
    );
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
