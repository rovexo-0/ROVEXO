import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAllListingsAsAdmin } from "@/lib/listings/repository";
import { revalidateDeletedListing } from "@/lib/listings/revalidate-published-listing";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  // Second confirmation: user must type DELETE before execution.
  confirm: z.literal("DELETE"),
});

async function getListingCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("products")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ ok: true, total: await getListingCount() });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: 'Confirmation failed. Type "DELETE" to proceed.' },
      { status: 400 },
    );
  }

  await auditSuperAdminAction({
    actorId: auth.user.id,
    action: "marketplace.delete_all_listings",
    resourceType: "marketplace",
    metadata: { confirm: body.confirm },
  });

  const report = await deleteAllListingsAsAdmin();

  // Rebuild Homepage, Search, Categories, Seller Stores, and user-private surfaces.
  revalidateDeletedListing();

  return NextResponse.json({
    ok: true,
    message:
      report.remaining === 0
        ? `Deleted ${report.deleted} listing(s). Marketplace is now empty.`
        : `Deleted ${report.deleted} listing(s). ${report.remaining} remaining.`,
    report,
  });
}
