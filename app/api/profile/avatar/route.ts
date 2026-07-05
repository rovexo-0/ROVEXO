import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { updateAvatarUrl } from "@/lib/profile/service";
import { deleteAvatar, uploadAvatar, StorageValidationError } from "@/lib/storage/upload";

export const runtime = "nodejs";

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const result = await uploadAvatar(auth.user.id, file);
    await updateAvatarUrl(auth.user.id, result.publicUrl);

    return NextResponse.json({ avatarUrl: result.publicUrl });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message = describeError(error);
    // Surface the real failure to the server logs for diagnosis.
    console.error("[avatar-upload] failed", {
      userId: auth.user.id,
      message,
      error,
    });

    return NextResponse.json(
      { error: `Avatar upload failed: ${message}` },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    await deleteAvatar(auth.user.id);
    await updateAvatarUrl(auth.user.id, null);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = describeError(error);
    console.error("[avatar-delete] failed", { userId: auth.user.id, message, error });
    return NextResponse.json({ error: `Unable to remove avatar: ${message}` }, { status: 500 });
  }
}
