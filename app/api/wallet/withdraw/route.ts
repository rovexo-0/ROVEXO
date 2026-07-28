import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { emitSmartNotification } from "@/lib/notifications/events";
import { NOTIFICATION_ROUTES } from "@/lib/notifications/routing";
import {
  isWalletMoneyEnvReady,
  MISSING_REQUIRED_SECRET,
  validateWalletMoneyEnv,
} from "@/lib/wallet/env-validation";
import { recordWithdrawal } from "@/lib/wallet/store";

const withdrawSchema = z.object({
  methodId: z.string().uuid(),
  amount: z.number().positive(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "wallet-withdraw", 10, 60_000);
  if (limited) {
    return limited;
  }

  if (!isWalletMoneyEnvReady("withdraw")) {
    const validation = validateWalletMoneyEnv("withdraw");
    return NextResponse.json(
      {
        error: MISSING_REQUIRED_SECRET,
        code: "MISSING_REQUIRED_SECRET",
        ownerControlledMissing: validation.ok ? [] : validation.ownerControlledMissing,
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid withdrawal amount." }, { status: 400 });
  }

  const headerKey = request.headers.get("idempotency-key");
  const clientKey = parsed.data.idempotencyKey ?? headerKey;

  const transaction = await recordWithdrawal({
    userId: auth.user.id,
    methodId: parsed.data.methodId,
    amount: parsed.data.amount,
    idempotencyKey: clientKey,
  });

  if (!transaction) {
    return NextResponse.json(
      {
        error:
          "Unable to submit withdrawal. Check your balance, bank account, and encryption configuration.",
      },
      { status: 400 },
    );
  }

  void emitSmartNotification({
    userId: auth.user.id,
    eventType: "payout",
    idempotencyKey: `withdraw:${transaction.id}`,
    notificationType: "payment",
    title:
      transaction.status === "completed" ? "Withdrawal confirmed" : "Withdrawal submitted",
    subtitle:
      transaction.status === "completed"
        ? `£${parsed.data.amount.toFixed(2)} was transferred securely.`
        : `£${parsed.data.amount.toFixed(2)} is being processed securely.`,
    href: `${NOTIFICATION_ROUTES.walletWithdrawal(transaction.id)}`,
    payload: { transactionId: transaction.id, amount: parsed.data.amount, status: transaction.status },
  });

  return NextResponse.json({ transaction });
}
