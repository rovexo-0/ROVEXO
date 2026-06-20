import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { buildProductImagePath, buildTempImagePath } from "@/lib/storage/server-images";
import { getPublicStorageUrl, validateUploadFile } from "@/lib/storage/upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "listings-upload", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const thumbnail = formData.get("thumbnail");
    const productId = String(formData.get("productId") ?? "").trim() || null;
    const sessionId = String(formData.get("sessionId") ?? "").trim() || crypto.randomUUID();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!(thumbnail instanceof File)) {
      return NextResponse.json({ error: "Thumbnail image is required." }, { status: 400 });
    }

    validateUploadFile("products", file);
    validateUploadFile("products", thumbnail);

    if (productId) {
      const supabase = await createClient();
      const { data: product } = await supabase
        .from("products")
        .select("seller_id")
        .eq("id", productId)
        .eq("seller_id", auth.user.id)
        .maybeSingle();

      if (!product) {
        return NextResponse.json({ error: "Listing not found." }, { status: 404 });
      }
    }

    const [fullBuffer, thumbnailBuffer] = await Promise.all([
      file.arrayBuffer().then((data) => Buffer.from(data)),
      thumbnail.arrayBuffer().then((data) => Buffer.from(data)),
    ]);
    const contentType = "image/jpeg" as const;
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;

    const fullPath = productId
      ? buildProductImagePath(auth.user.id, productId, filename)
      : buildTempImagePath(auth.user.id, sessionId, filename);

    const thumbPath = fullPath.replace(/\.jpg$/, "-thumb.jpg");

    const admin = createAdminClient();

    const [fullUpload, thumbUpload] = await Promise.all([
      admin.storage.from("products").upload(fullPath, fullBuffer, {
        contentType,
        upsert: true,
      }),
      admin.storage.from("products").upload(thumbPath, thumbnailBuffer, {
        contentType,
        upsert: true,
      }),
    ]);

    if (fullUpload.error || thumbUpload.error) {
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    return NextResponse.json({
      url: getPublicStorageUrl("products", fullPath),
      thumbnailUrl: getPublicStorageUrl("products", thumbPath),
      storagePath: fullPath,
      thumbnailStoragePath: thumbPath,
      sessionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const { storagePath, thumbnailStoragePath } = (await request.json()) as {
      storagePath?: string;
      thumbnailStoragePath?: string;
    };

    if (!storagePath?.startsWith(`${auth.user.id}/`)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const admin = createAdminClient();
    const paths = [storagePath, thumbnailStoragePath].filter(Boolean) as string[];
    await admin.storage.from("products").remove(paths);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete image." }, { status: 500 });
  }
}
