import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { toStaffActionContext } from "@/lib/staff-profile";
import {
  ensureDirectStaffChannel,
  listStaffChannelMessages,
  listStaffChannels,
} from "@/lib/staff-enterprise/messaging";
import {
  bookmarkStaffMessage,
  markStaffMessageRead,
  pinStaffMessage,
  searchStaffMessages,
  sendStaffMessageEnhanced,
  setStaffTyping,
} from "@/lib/staff-comms/messages";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const q = searchParams.get("q");

  if (q) {
    const results = await searchStaffMessages(auth.staffId, q);
    return NextResponse.json({ results });
  }

  if (channelId) {
    const messages = await listStaffChannelMessages(channelId, 100);
    return NextResponse.json({ messages });
  }

  const channels = await listStaffChannels(auth.staffId);
  return NextResponse.json({ channels });
}

const postSchema = z.object({
  action: z.enum(["send", "read", "typing", "pin", "bookmark", "open_dm"]),
  channelId: z.string().uuid().optional(),
  targetStaffId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  body: z.string().optional(),
  messageType: z.string().optional(),
  typing: z.boolean().optional(),
  mentionStaffIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiStaff(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = postSchema.parse(await request.json());
    const context = toStaffActionContext(auth.user.id, request);

    if (body.action === "open_dm" && body.targetStaffId) {
      const channelId = await ensureDirectStaffChannel(auth.staffId, body.targetStaffId, auth.user.id);
      return NextResponse.json({ channelId });
    }

    if (body.action === "send") {
      if (!body.channelId || !body.body?.trim()) {
        return NextResponse.json({ error: "channelId and body required." }, { status: 400 });
      }
      const message = await sendStaffMessageEnhanced({
        staffId: auth.staffId,
        channelId: body.channelId,
        body: body.body,
        messageType: body.messageType,
        mentionStaffIds: body.mentionStaffIds,
        context,
      });
      return NextResponse.json({ message });
    }

    if (body.action === "read" && body.messageId) {
      await markStaffMessageRead(body.messageId, auth.staffId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "typing" && body.channelId) {
      await setStaffTyping(body.channelId, auth.staffId, body.typing ?? false);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "pin" && body.channelId && body.messageId) {
      await pinStaffMessage(body.channelId, body.messageId, auth.user.id, context);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "bookmark" && body.messageId) {
      await bookmarkStaffMessage(auth.staffId, body.messageId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Message action failed." },
      { status: 400 },
    );
  }
}
