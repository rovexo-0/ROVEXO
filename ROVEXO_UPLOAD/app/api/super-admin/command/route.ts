import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { listAuditTimeline } from "@/lib/super-admin/dashboard";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const entries = await listAuditTimeline(limit);
  return NextResponse.json({ entries });
}

const commandSchema = z.object({
  action: z.enum([
    "suspend_user",
    "restore_user",
    "verify_user",
    "verify_company",
    "maintenance_mode",
    "grant_featured",
    "grant_bump",
    "grant_premium",
    "grant_lifetime_premium",
    "credit_wallet",
    "refund_payment",
    "broadcast_notification",
    "send_emergency_notification",
    "send_category_notification",
    "send_push_notification",
    "send_email_notification",
    "create_backup",
  ]),
  userId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  enabled: z.boolean().optional(),
  message: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  audience: z.enum(["all", "sellers", "businesses", "buyers", "admins"]).optional(),
  kind: z.enum(["platform", "category", "emergency"]).optional(),
  country: z.string().max(3).optional(),
  category: z
    .enum(["orders", "messages", "payments", "support", "marketing", "security", "business", "ai"])
    .optional(),
  amount: z.number().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = commandSchema.parse(await request.json());

    if (body.action === "maintenance_mode") {
      const { updatePlatformSetting } = await import("@/lib/super-admin/settings");
      await updatePlatformSetting({
        actorId: auth.user.id,
        key: "maintenance_mode",
        value: {
          enabled: Boolean(body.enabled),
          message:
            body.message ??
            "ROVEXO is undergoing scheduled maintenance. Please check back shortly.",
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "create_backup") {
      const { recordBackupAcknowledgement } = await import("@/lib/super-admin/insights");
      await recordBackupAcknowledgement(auth.user.id);
      return NextResponse.json({ ok: true, message: "Backup request logged for ops pipeline." });
    }

    if (body.action === "broadcast_notification" || body.action === "send_emergency_notification" || body.action === "send_category_notification") {
      const { broadcastSuperAdminNotification } = await import("@/lib/super-admin/notifications");
      const kind =
        body.action === "send_emergency_notification"
          ? "emergency"
          : body.action === "send_category_notification"
            ? "category"
            : (body.kind ?? "platform");
      const result = await broadcastSuperAdminNotification({
        actorId: auth.user.id,
        title: body.title ?? "ROVEXO update",
        subtitle: body.subtitle ?? "",
        audience: body.audience ?? "all",
        kind,
        country: body.country,
        category: body.category,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "send_push_notification") {
      if (!body.userId) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
      }
      const { sendSuperAdminPushNotification } = await import("@/lib/super-admin/notifications");
      await sendSuperAdminPushNotification({
        actorId: auth.user.id,
        userId: body.userId,
        title: body.title ?? "ROVEXO update",
        subtitle: body.subtitle ?? "",
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "send_email_notification") {
      if (!body.userId) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
      }
      const { sendSuperAdminEmailNotification } = await import("@/lib/super-admin/notifications");
      await sendSuperAdminEmailNotification({
        actorId: auth.user.id,
        userId: body.userId,
        title: body.title ?? "ROVEXO update",
        subtitle: body.subtitle ?? "",
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "refund_payment") {
      if (!body.orderId) {
        return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
      }
      const { refundOrderPayment } = await import("@/lib/super-admin/grants");
      await refundOrderPayment({ actorId: auth.user.id, orderId: body.orderId });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "credit_wallet") {
      if (!body.userId || body.amount == null) {
        return NextResponse.json({ error: "User ID and amount are required." }, { status: 400 });
      }
      const { adjustWalletBalance } = await import("@/lib/super-admin/grants");
      await adjustWalletBalance({
        actorId: auth.user.id,
        userId: body.userId,
        amount: body.amount,
        description: body.message ?? "Super Admin wallet credit",
      });
      return NextResponse.json({ ok: true });
    }

    if (!body.userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const { updateSuperAdminUser } = await import("@/lib/super-admin/users");
    const { grantPromotion } = await import("@/lib/super-admin/grants");

    switch (body.action) {
      case "suspend_user":
        await updateSuperAdminUser({
          actorId: auth.user.id,
          userId: body.userId,
          action: "suspend",
          payload: { reason: body.message ?? "Suspended from Command Centre" },
        });
        break;
      case "restore_user":
        await updateSuperAdminUser({
          actorId: auth.user.id,
          userId: body.userId,
          action: "restore",
        });
        break;
      case "verify_user":
        await updateSuperAdminUser({
          actorId: auth.user.id,
          userId: body.userId,
          action: "verify",
        });
        break;
      case "verify_company":
        await updateSuperAdminUser({
          actorId: auth.user.id,
          userId: body.userId,
          action: "set_entitlements",
          payload: { companyVerified: true },
        });
        break;
      case "grant_premium":
        await updateSuperAdminUser({
          actorId: auth.user.id,
          userId: body.userId,
          action: "set_entitlements",
          payload: { premium: true, lifetimePremium: false },
        });
        break;
      case "grant_lifetime_premium":
        await updateSuperAdminUser({
          actorId: auth.user.id,
          userId: body.userId,
          action: "set_entitlements",
          payload: { premium: true, lifetimePremium: true },
        });
        break;
      case "grant_featured":
      case "grant_bump":
        if (!body.productId) {
          return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
        }
        await grantPromotion({
          actorId: auth.user.id,
          sellerId: body.userId,
          productId: body.productId,
          type: body.action === "grant_featured" ? "feature" : "bump",
        });
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Command failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
