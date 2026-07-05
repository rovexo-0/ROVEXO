import { NextResponse } from "next/server";
import { requireApiAuth, requireApiListingRole } from "@/lib/auth/session";
import { duplicateSellerListing } from "@/lib/listings/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiListingRole();
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const listing = await duplicateSellerListing(auth.user.id, id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}
