import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { validateBankAccountInput } from "@/lib/wallet/bank-account";
import { removeBankAccount, saveBankAccount } from "@/lib/wallet/store";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const validation = validateBankAccountInput({
    accountHolderName: String(input.accountHolderName ?? ""),
    sortCode: String(input.sortCode ?? ""),
    accountNumber: String(input.accountNumber ?? ""),
    confirmAccountNumber: String(input.confirmAccountNumber ?? ""),
  });

  if (!validation.valid) {
    return NextResponse.json({ success: false, errors: validation.errors }, { status: 422 });
  }

  const method = await saveBankAccount({
    userId: auth.user.id,
    accountHolderName: validation.normalized.accountHolderName,
    sortCode: validation.normalized.sortCode,
    accountNumber: validation.normalized.accountNumber,
  });

  if (!method) {
    return NextResponse.json(
      { success: false, error: "Could not save your bank account. Please try again." },
      { status: 500 },
    );
  }

  await syncAutoVerifiedProfile(auth.user.id);

  return NextResponse.json({ success: true, method });
}

export async function DELETE() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const removed = await removeBankAccount(auth.user.id);
  if (!removed) {
    return NextResponse.json(
      { success: false, error: "Could not remove your bank account. Please try again." },
      { status: 500 },
    );
  }

  await syncAutoVerifiedProfile(auth.user.id);

  return NextResponse.json({ success: true });
}
