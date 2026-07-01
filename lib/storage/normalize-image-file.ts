const IMAGE_EXTENSION = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

function isHeicLike(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (!file.type && IMAGE_EXTENSION.test(file.name)) return true;
  return isHeicLike(file);
}

/** Decode HEIC/unknown mobile camera files into JPEG before compression/upload. */
export async function normalizeImageFile(file: File): Promise<File> {
  if (!isLikelyImageFile(file)) {
    throw new Error("Only image files are supported.");
  }

  if (file.type === "image/jpeg" && !isHeicLike(file)) {
    return file;
  }

  if (
    !isHeicLike(file) &&
    (file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif")
  ) {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    if (file.type.startsWith("image/")) return file;
    throw new Error("This photo format is not supported on this device.");
  }

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to process image.");
    }
    context.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      throw new Error("Unable to convert image.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    throw new Error(
      "This photo could not be processed. Try taking a new photo or choosing JPEG/PNG from your gallery.",
    );
  } finally {
    bitmap?.close?.();
  }
}
