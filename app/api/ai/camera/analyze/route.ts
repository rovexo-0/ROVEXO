import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { analyzeImageBuffer } from "@/lib/ai-camera/analyze";
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
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = analyzeImageBuffer(buffer, file.name);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to analyze image." }, { status: 500 });
  }
}
