import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { updateAvatarUrl } from "@/lib/profile/service";
import { deleteStorageObject, uploadAvatar, StorageValidationError } from "@/lib/storage/upload";

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
    return NextResponse.json({ error: "Unable to upload avatar." }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    await deleteStorageObject("avatars", `${auth.user.id}/avatar.webp`).catch(() => undefined);
    await deleteStorageObject("avatars", `${auth.user.id}/avatar.jpg`).catch(() => undefined);
    await deleteStorageObject("avatars", `${auth.user.id}/avatar.png`).catch(() => undefined);
    await updateAvatarUrl(auth.user.id, null);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to remove avatar." }, { status: 500 });
  }
}
