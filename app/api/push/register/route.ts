import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { PUSH_DEVICE_TOKENS_TABLE } from "@/lib/push/fcm-http-v1";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const registerSchema = z
  .object({
    token: z.string().trim().min(1).max(4096),
    platform: z.literal("android"),
    provider: z.literal("fcm"),
  })
  .strict();

const unregisterSchema = z
  .object({
    token: z.string().trim().min(1).max(4096),
  })
  .strict();

function invalidRegistration(): NextResponse {
  return NextResponse.json({ error: "Invalid registration." }, { status: 400 });
}

function rejectsClientUserId(body: unknown): boolean {
  return Boolean(body && typeof body === "object" && "userId" in body);
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body: unknown = await request.json();
    if (rejectsClientUserId(body)) {
      return invalidRegistration();
    }

    const parsed = registerSchema.parse(body);
    const admin = createAdminClient();

    // Token ownership: one FCM token → one user (reassign on login switch).
    await admin.from(PUSH_DEVICE_TOKENS_TABLE).delete().eq("token", parsed.token);

    await admin.from(PUSH_DEVICE_TOKENS_TABLE).insert({
      user_id: auth.user.id,
      token: parsed.token,
      provider: parsed.provider,
      platform: parsed.platform,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return invalidRegistration();
    }
    return NextResponse.json({ error: "Unable to save registration." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body: unknown = await request.json();
    if (rejectsClientUserId(body)) {
      return invalidRegistration();
    }

    const parsed = unregisterSchema.parse(body);
    const admin = createAdminClient();

    await admin
      .from(PUSH_DEVICE_TOKENS_TABLE)
      .delete()
      .eq("user_id", auth.user.id)
      .eq("token", parsed.token);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Token required." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to remove registration." }, { status: 500 });
  }
}
