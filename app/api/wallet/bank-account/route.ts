import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { validateBankAccountInput } from "@/lib/wallet/bank-account";
import { getBankAccountDisplaySummary, removeBankAccount, saveBankAccount } from "@/lib/wallet/store";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";
import { normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";

function sellerContextFromRequest(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  return normalizeSellerContext(
    body?.sellerContext ?? body?.seller_context ?? url.searchParams.get("sellerContext"),
  );
}

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "wallet-bank-account", 20, 60_000);
  if (limited) return limited;

  const sellerContext = sellerContextFromRequest(request);
  const summary = await getBankAccountDisplaySummary(auth.user.id, sellerContext);
  return NextResponse.json({
    success: true,
    sellerContext,
    summary: summary
      ? {
          connected: summary.connected,
          displayName: summary.displayName,
          lastDigits: summary.lastDigits,
          sortCodeLast2: summary.sortCodeLast2,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "wallet-bank-account", 20, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const sellerContext = sellerContextFromRequest(request, input);
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
    sellerContext,
  });

  if (!method) {
    return NextResponse.json(
      { success: false, error: "Could not save your bank account. Please try again." },
      { status: 500 },
    );
  }

  await syncAutoVerifiedProfile(auth.user.id);

  return NextResponse.json({ success: true, method, sellerContext });
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "wallet-bank-account", 20, 60_000);
  if (limited) return limited;

  const sellerContext = sellerContextFromRequest(request);
  const removed = await removeBankAccount(auth.user.id, sellerContext);
  if (!removed) {
    return NextResponse.json(
      { success: false, error: "Could not remove your bank account. Please try again." },
      { status: 500 },
    );
  }

  await syncAutoVerifiedProfile(auth.user.id);

  return NextResponse.json({ success: true, sellerContext });
}
