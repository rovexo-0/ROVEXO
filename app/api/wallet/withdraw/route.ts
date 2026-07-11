import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { emitSmartNotification } from "@/lib/notifications/events";
import { NOTIFICATION_ROUTES } from "@/lib/notifications/routing";
import { recordWithdrawal } from "@/lib/wallet/store";

const withdrawSchema = z.object({
  methodId: z.string().uuid(),
  amount: z.number().positive(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
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

  const transaction = await recordWithdrawal({
    userId: auth.user.id,
    methodId: parsed.data.methodId,
    amount: parsed.data.amount,
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Unable to submit withdrawal. Check your balance and bank account." },
      { status: 400 },
    );
  }

  void emitSmartNotification({
    userId: auth.user.id,
    eventType: "payout",
    idempotencyKey: `withdraw:${transaction.id}`,
    notificationType: "payment",
    title: "Withdrawal submitted",
    subtitle: `£${parsed.data.amount.toFixed(2)} is being transferred to your bank account.`,
    href: `${NOTIFICATION_ROUTES.walletWithdrawal(transaction.id)}`,
    payload: { transactionId: transaction.id, amount: parsed.data.amount },
  });

  return NextResponse.json({ transaction });
}
