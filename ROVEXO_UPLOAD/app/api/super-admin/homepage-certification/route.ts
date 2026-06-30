import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getHomepageCertificationSnapshot } from "@/lib/homepage-enterprise-certification-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const homepageCertification = await getHomepageCertificationSnapshot();
  return NextResponse.json({ homepageCertification });
}
