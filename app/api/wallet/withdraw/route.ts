import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { processStripeWithdrawal } from "@/lib/stripe/payouts";
import { getWithdrawMethodById, recordWithdrawal } from "@/lib/wallet/store";

type WithdrawRequest = {
  methodId?: string;
  amount?: number;
};

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "wallet-withdraw", 5, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as WithdrawRequest;
    const methodId = body.methodId?.trim();
    const amount = body.amount;

    if (!methodId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal request." }, { status: 400 });
    }

    const method = await getWithdrawMethodById(auth.user.id, methodId);
    if (!method) {
      return NextResponse.json({ error: "Invalid withdrawal method." }, { status: 400 });
    }

    const transaction =
      method.provider === "stripe_connect"
        ? await processStripeWithdrawal({
            userId: auth.user.id,
            methodId,
            amount,
          })
        : await recordWithdrawal({
            userId: auth.user.id,
            methodId,
            amount,
          });

    if (!transaction) {
      return NextResponse.json(
        { error: "Insufficient balance, Connect not configured, or payout failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({ transaction });
  } catch {
    return NextResponse.json({ error: "Unable to process withdrawal." }, { status: 500 });
  }
}
