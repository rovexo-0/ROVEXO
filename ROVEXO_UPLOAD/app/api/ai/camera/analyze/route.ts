import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { analyzeImages } from "@/lib/ai-camera/analyze";
import { AI_CAMERA_MAX_IMAGES } from "@/lib/ai-camera/config";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai-camera", 20, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const formData = await request.formData();
    const multi = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
    const single = formData.get("image");
    const files =
      multi.length > 0
        ? multi
        : single instanceof File
          ? [single]
          : [];

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
    }

    if (files.length > AI_CAMERA_MAX_IMAGES) {
      return NextResponse.json(
        { error: `You can analyze up to ${AI_CAMERA_MAX_IMAGES} images at once.` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
      }
    }

    const images = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type || "image/jpeg",
        fileName: file.name,
      })),
    );

    const result = await analyzeImages(images, { fileName: files[0]?.name });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
