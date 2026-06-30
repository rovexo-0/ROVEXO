import { NextResponse } from "next/server";
import {
  deleteAllReadNotifications,
  deleteNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/notifications/store";
import { requireApiAuth } from "@/lib/auth/session";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!checkRateLimit(auth.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const notifications = await listNotifications(auth.user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!checkRateLimit(auth.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as {
      ids?: string[];
      read?: boolean;
      delete?: boolean;
      markAllRead?: boolean;
    };

    if (body.markAllRead) {
      await markAllNotificationsRead(auth.user.id);
    } else if (!body.ids?.length) {
      return NextResponse.json({ error: "No notifications selected." }, { status: 400 });
    } else if (body.delete) {
      await deleteNotifications(auth.user.id, body.ids);
    } else if (body.read) {
      await markNotificationsRead(auth.user.id, body.ids);
    }

    const notifications = await listNotifications(auth.user.id);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!checkRateLimit(auth.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { ids?: string[]; clearRead?: boolean };

    if (body.clearRead) {
      await deleteAllReadNotifications(auth.user.id);
    } else if (!body.ids?.length) {
      return NextResponse.json({ error: "No notifications selected." }, { status: 400 });
    } else {
      await deleteNotifications(auth.user.id, body.ids);
    }

    const notifications = await listNotifications(auth.user.id);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Unable to delete notifications." }, { status: 500 });
  }
}
