import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiListingRole } from "@/lib/auth/session";
import { setListingStatus } from "@/lib/listings/repository";

type RouteContext = { params: Promise<{ id: string }> };

const statusSchema = z.object({
  action: z.enum(["pause", "reactivate", "publish", "sold"]),
});

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiListingRole();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  try {
    const body = statusSchema.parse(await request.json());

    const statusMap = {
      pause: "paused" as const,
      reactivate: "published" as const,
      publish: "published" as const,
      sold: "sold" as const,
    };

    const listing = await setListingStatus(auth.user.id, id, statusMap[body.action]);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
}
