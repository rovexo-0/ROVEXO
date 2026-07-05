import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { toStaffActionContext } from "@/lib/staff-profile";
import { syncStaffOfflineQueue, queueStaffOfflineAction } from "@/lib/staff-comms/offline";

export async function GET() {
  const auth = await requireApiStaff();
  if (auth instanceof NextResponse) return auth;

  const context = toStaffActionContext(auth.user.id, new Request("http://local"));
  const result = await syncStaffOfflineQueue(auth.staffId, context);
  return NextResponse.json(result);
}

const postSchema = z.object({
  actionType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  const auth = await requireApiStaff(request);
  if (auth instanceof NextResponse) return auth;

  const body = postSchema.parse(await request.json());
  const id = await queueStaffOfflineAction({
    staffId: auth.staffId,
    actionType: body.actionType,
    payload: body.payload,
  });

  return NextResponse.json({ id, queued: true }, { status: 202 });
}
