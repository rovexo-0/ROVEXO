import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { toStaffActionContext } from "@/lib/staff-profile";
import {
  answerStaffCall,
  declineStaffCall,
  endStaffCall,
  initiateStaffCall,
  listStaffCallHistory,
  persistStaffCallSignal,
  transferStaffCall,
  updateCallParticipantMedia,
} from "@/lib/staff-comms/calls";

export async function GET() {
  const auth = await requireApiStaff();
  if (auth instanceof NextResponse) return auth;

  const history = await listStaffCallHistory(auth.staffId);
  return NextResponse.json({ history });
}

const postSchema = z.object({
  action: z.enum([
    "initiate",
    "answer",
    "decline",
    "end",
    "transfer",
    "signal",
    "media",
  ]),
  callId: z.string().uuid().optional(),
  callType: z.enum(["voice", "video", "conference"]).optional(),
  participantStaffIds: z.array(z.string().uuid()).optional(),
  targetStaffId: z.string().uuid().optional(),
  channelId: z.string().uuid().optional(),
  recordingEnabled: z.boolean().optional(),
  signalType: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  muted: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  speakerEnabled: z.boolean().optional(),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiStaff(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = postSchema.parse(await request.json());
    const context = toStaffActionContext(auth.user.id, request);

    if (body.action === "initiate") {
      const participants = body.participantStaffIds ?? [];
      if (!participants.length) {
        return NextResponse.json({ error: "participantStaffIds required." }, { status: 400 });
      }
      const call = await initiateStaffCall({
        initiatorStaffId: auth.staffId,
        participantStaffIds: participants,
        callType: body.callType ?? "voice",
        channelId: body.channelId,
        recordingEnabled: body.recordingEnabled,
        context,
      });
      return NextResponse.json(call);
    }

    if (!body.callId) {
      return NextResponse.json({ error: "callId required." }, { status: 400 });
    }

    switch (body.action) {
      case "answer":
        await answerStaffCall(body.callId, auth.staffId, context);
        break;
      case "decline":
        await declineStaffCall(body.callId, auth.staffId, context);
        break;
      case "end":
        await endStaffCall(body.callId, auth.staffId, body.reason ?? "ended", context);
        break;
      case "transfer":
        if (!body.targetStaffId) {
          return NextResponse.json({ error: "targetStaffId required." }, { status: 400 });
        }
        await transferStaffCall({
          callId: body.callId,
          fromStaffId: auth.staffId,
          toStaffId: body.targetStaffId,
          context,
        });
        break;
      case "signal":
        await persistStaffCallSignal({
          callId: body.callId,
          senderStaffId: auth.staffId,
          targetStaffId: body.targetStaffId,
          signalType: body.signalType ?? "ice",
          payload: body.payload ?? {},
        });
        break;
      case "media":
        await updateCallParticipantMedia({
          callId: body.callId,
          staffId: auth.staffId,
          muted: body.muted,
          videoEnabled: body.videoEnabled,
          speakerEnabled: body.speakerEnabled,
        });
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Call action failed." },
      { status: 400 },
    );
  }
}
