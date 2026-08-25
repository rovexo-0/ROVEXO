import { NextResponse, after } from "next/server";
import { requireCookieOrBearerListingRole } from "@/lib/saved/saved-api-auth-v1";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { buildProductImagePath, buildTempImagePath } from "@/lib/storage/server-images";
import { getPublicStorageUrl, validateUploadFile } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/server";
import { analyzeImageMetadata } from "@/lib/moderation/analyzer";
import { enqueueModerationReview } from "@/lib/moderation/service";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "listings-upload", 30, 60_000);
  if (limited) return limited;

  const auth = await requireCookieOrBearerListingRole(request);
  if (auth instanceof NextResponse) return auth;

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
      const supabase = tryCreateAdminClient() ?? (await createClient());
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

    const [fullRaw, thumbnailRaw] = await Promise.all([
      file.arrayBuffer().then((data) => Buffer.from(data)),
      thumbnail.arrayBuffer().then((data) => Buffer.from(data)),
    ]);

    const { assertValidJpegBuffer } = await import(
      "@/lib/product-integration/photo-system-integration-foundation-v1"
    );
    const fullBuffer = fullRaw;
    const thumbnailBuffer = thumbnailRaw;
    assertValidJpegBuffer(fullBuffer, "listing full image");
    assertValidJpegBuffer(thumbnailBuffer, "listing thumbnail");
    const contentType = "image/jpeg" as const;
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;

    const fullPath = productId
      ? buildProductImagePath(auth.user.id, productId, filename)
      : buildTempImagePath(auth.user.id, sessionId, filename);

    const thumbPath = fullPath.replace(/\.jpg$/, "-thumb.jpg");

    const supabase = tryCreateAdminClient() ?? (await createClient());

    // Product image filenames are unique + immutable (timestamp + random id), so
    // they can be cached aggressively by the CDN and browsers for a year.
    // Upload uses the authenticated seller session — storage RLS enforces own folder.
    //
    // CRITICAL: upload as Blob (FormData multipart), never raw Node Buffer as the
    // fetch body. Buffer-as-body has produced UTF-8-corrupted objects in Production
    // (SOI FF D8 FF → EF BF BD) which pass storage HTTP 200 but fail /_next/image.
    //
    // RAW persist uses cacheControl "0" so the first GET cannot pin unenhanced
    // bytes for a year. after() enhance overwrites the SAME paths with the
    // existing one-year cacheControl.
    const cacheControl = "31536000";
    const rawCacheControl = "0";
    const fullBlob = new Blob([new Uint8Array(fullBuffer)], { type: contentType });
    const thumbBlob = new Blob([new Uint8Array(thumbnailBuffer)], { type: contentType });
    const [fullUpload, thumbUpload] = await Promise.all([
      supabase.storage.from("products").upload(fullPath, fullBlob, {
        contentType,
        upsert: true,
        cacheControl: rawCacheControl,
      }),
      supabase.storage.from("products").upload(thumbPath, thumbBlob, {
        contentType,
        upsert: true,
        cacheControl: rawCacheControl,
      }),
    ]);

    if (fullUpload.error || thumbUpload.error) {
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    const imageResult = analyzeImageMetadata({ fileName: filename });
    if (productId && imageResult.decision !== "approved") {
      await enqueueModerationReview({
        targetType: "listing_image",
        targetId: productId,
        productId,
        sellerId: auth.user.id,
        source: "image_upload",
        result: imageResult,
        payload: { storagePath: fullPath },
      });
    }

    try {
      after(async () => {
        try {
          const { enhanceListingImage } = await import("@/lib/media/enhance-listing-image");
          const enhancedClient = tryCreateAdminClient() ?? (await createClient());
          const enhancedFull = await enhanceListingImage(fullRaw);
          assertValidJpegBuffer(enhancedFull.buffer, "listing full image");
          const enhancedFullBlob = new Blob([new Uint8Array(enhancedFull.buffer)], {
            type: contentType,
          });
          await enhancedClient.storage.from("products").upload(fullPath, enhancedFullBlob, {
            contentType,
            upsert: true,
            cacheControl,
          });
          const enhancedThumb = await enhanceListingImage(thumbnailRaw);
          assertValidJpegBuffer(enhancedThumb.buffer, "listing thumbnail");
          const enhancedThumbBlob = new Blob([new Uint8Array(enhancedThumb.buffer)], {
            type: contentType,
          });
          await enhancedClient.storage.from("products").upload(thumbPath, enhancedThumbBlob, {
            contentType,
            upsert: true,
            cacheControl,
          });
        } catch (error) {
          console.error("[upload-after] enhance failed", {
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      });
    } catch (error) {
      console.error("[upload-after] after() registration failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
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
  const auth = await requireCookieOrBearerListingRole(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { storagePath, thumbnailStoragePath } = (await request.json()) as {
      storagePath?: string;
      thumbnailStoragePath?: string;
    };

    if (!storagePath?.startsWith(`${auth.user.id}/`)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = tryCreateAdminClient() ?? (await createClient());
    const paths = [storagePath, thumbnailStoragePath].filter(Boolean) as string[];
    await supabase.storage.from("products").remove(paths);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete image." }, { status: 500 });
  }
}
