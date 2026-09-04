import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
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
import { isSellerContext } from "@/lib/seller-context/seller-context-v1";

const withdrawSchema = z.object({
  methodId: z.string().uuid(),
  amount: z.number().positive(),
  idempotencyKey: z.string().min(8).max(128).optional(),
  sellerContext: z.enum(["individual", "business"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
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
  // Per-intent key: client preferred; never fall back to shared ":default".
  const clientKey =
    parsed.data.idempotencyKey?.trim() ||
    headerKey?.trim() ||
    randomUUID();

  const sellerContextRaw = parsed.data.sellerContext ?? "individual";
  if (!isSellerContext(sellerContextRaw)) {
    return NextResponse.json({ error: "Invalid seller context." }, { status: 400 });
  }

  const transaction = await recordWithdrawal({
    userId: auth.user.id,
    methodId: parsed.data.methodId,
    amount: parsed.data.amount,
    idempotencyKey: clientKey,
    sellerContext: sellerContextRaw,
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

  const bankSettled = transaction.status === "completed";

  void emitSmartNotification({
    userId: auth.user.id,
    eventType: "payout",
    idempotencyKey: `withdraw:${transaction.id}`,
    notificationType: "payment",
    title: bankSettled ? "Withdrawal confirmed" : "Withdrawal submitted",
    subtitle: bankSettled
      ? `£${parsed.data.amount.toFixed(2)} was transferred securely.`
      : `£${parsed.data.amount.toFixed(2)} is being processed securely.`,
    href: `${NOTIFICATION_ROUTES.walletWithdrawal(transaction.id)}`,
    payload: {
      transactionId: transaction.id,
      amount: parsed.data.amount,
      status: transaction.status,
      sellerContext: sellerContextRaw,
    },
  });

  return NextResponse.json({ transaction });
}
