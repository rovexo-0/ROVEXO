import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiListingRole } from "@/lib/auth/session";
import { setListingStatus } from "@/lib/listings/repository";
import { revalidatePublishedListing } from "@/lib/listings/revalidate-published-listing";
import {
  processFollowNotificationEvent,
  resolveFollowNotificationActor,
} from "@/lib/follow-notifications";

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

    // Pause / sold must leave public ISR surfaces immediately; reactivate must restore.
    // Same canonical bust as publish/edit — not after() (Homepage revalidate=60).
    revalidatePublishedListing(listing.slug);

    if (
      listing.status === "published" &&
      (body.action === "reactivate" || body.action === "publish")
    ) {
      void (async () => {
        const actor = await resolveFollowNotificationActor(auth.user.id);
        await processFollowNotificationEvent({
          type: body.action === "reactivate" ? "ListingRelisted" : "NewListingPublished",
          actorId: auth.user.id,
          actorName: actor.name,
          actorUsername: actor.username,
          actorAvatarUrl: actor.avatarUrl,
          sellerId: auth.user.id,
          listingId: listing.id,
          listingSlug: listing.slug,
          listingTitle: listing.title,
          occurredAt: new Date().toISOString(),
          dedupeKey: `${body.action}:${listing.id}`,
        });
      })();
    }

    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
}
