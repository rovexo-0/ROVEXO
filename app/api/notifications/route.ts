import { NextResponse } from "next/server";
import {
  deleteNotifications,
  listNotifications,
  markNotificationsRead,
} from "@/lib/notifications/store";
import { requireApiAuth } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const notifications = await listNotifications(auth.user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as { ids?: string[]; read?: boolean; delete?: boolean };

    if (!body.ids?.length) {
      return NextResponse.json({ error: "No notifications selected." }, { status: 400 });
    }

    if (body.delete) {
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

  try {
    const body = (await request.json()) as { ids?: string[] };

    if (!body.ids?.length) {
      return NextResponse.json({ error: "No notifications selected." }, { status: 400 });
    }

    await deleteNotifications(auth.user.id, body.ids);
    const notifications = await listNotifications(auth.user.id);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Unable to delete notifications." }, { status: 500 });
  }
}
