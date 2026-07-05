import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordStaffActivity } from "@/lib/staff-profile/service";
import type { StaffActionContext } from "@/lib/staff-profile/types";

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/msword",
  "application/vnd.",
  "text/plain",
  "application/zip",
];

function admin() {
  return createAdminClient();
}

export function validateStaffAttachment(mimeType: string, sizeBytes: number): { ok: boolean; reason?: string } {
  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    return { ok: false, reason: "File exceeds 25MB limit." };
  }
  if (!ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    return { ok: false, reason: "File type not permitted." };
  }
  return { ok: true };
}

export async function attachStaffMessageFile(input: {
  messageId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  staffId: string;
  context: StaffActionContext;
}): Promise<{ id: string }> {
  const validation = validateStaffAttachment(input.mimeType, input.sizeBytes);
  if (!validation.ok) throw new Error(validation.reason);

  const { data, error } = await admin()
    .from("staff_message_attachments" as never)
    .insert({
      message_id: input.messageId,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      storage_path: input.storagePath,
      scan_status: "clean",
    } as never)
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Attachment failed.");

  await recordStaffActivity({
    staffId: input.staffId,
    actorId: input.context.actorId,
    module: "messaging",
    action: "File Shared",
    context: input.context,
    metadata: { messageId: input.messageId, fileName: input.fileName },
  });

  return { id: (data as { id: string }).id };
}

export function createStaffUploadPath(staffId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `staff-comms/${staffId}/${Date.now()}-${safeName}`;
}
