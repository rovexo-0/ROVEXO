import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { toStaffActionContext } from "@/lib/staff-profile";
import { attachStaffMessageFile, createStaffUploadPath, validateStaffAttachment } from "@/lib/staff-comms/files";
import { sendStaffMessageEnhanced } from "@/lib/staff-comms/messages";
import { createAdminClient } from "@/lib/supabase/admin";

const postSchema = z.object({
  channelId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  contentBase64: z.string().min(1),
  body: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiStaff(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = postSchema.parse(await request.json());
    const validation = validateStaffAttachment(body.mimeType, body.sizeBytes);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const context = toStaffActionContext(auth.user.id, request);
    const storagePath = createStaffUploadPath(auth.staffId, body.fileName);
    const admin = createAdminClient();
    const buffer = Buffer.from(body.contentBase64, "base64");

    const { error: uploadError } = await admin.storage
      .from("staff-comms")
      .upload(storagePath, buffer, { contentType: body.mimeType, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const message = await sendStaffMessageEnhanced({
      staffId: auth.staffId,
      channelId: body.channelId,
      body: body.body?.trim() || body.fileName,
      messageType: body.mimeType.startsWith("image/")
        ? "photo"
        : body.mimeType.startsWith("video/")
          ? "video"
          : body.mimeType.startsWith("audio/")
            ? "voice"
            : "document",
      context,
    });

    const attachment = await attachStaffMessageFile({
      messageId: message.id,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      storagePath,
      staffId: auth.staffId,
      context,
    });

    return NextResponse.json({ messageId: message.id, attachmentId: attachment.id, storagePath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "File upload failed." },
      { status: 400 },
    );
  }
}
