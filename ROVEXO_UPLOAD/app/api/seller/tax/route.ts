import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { upsertSellerTaxProfile } from "@/lib/seller/tax/service";
import { createConnectAccountLink } from "@/lib/stripe/connect";

const taxSchema = z.object({
  registrationType: z.enum(["personal", "pro_seller", "business_sole_trader", "business_company"]),
  fullName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  nino: z.string().optional(),
  utr: z.string().optional(),
  companyName: z.string().optional(),
  companyNumber: z.string().optional(),
  registeredAddress: z.string().optional(),
  vatNumber: z.string().optional(),
  directorName: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { getSellerTaxProfile } = await import("@/lib/seller/tax/service");
  const profile = await getSellerTaxProfile(auth.user.id);
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const body = taxSchema.parse(await request.json());
    const profile = await upsertSellerTaxProfile({
      sellerId: auth.user.id,
      registrationType: body.registrationType,
      fullName: body.fullName,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      postcode: body.postcode,
      country: body.country,
      email: body.email,
      phone: body.phone,
      nino: body.nino,
      utr: body.utr,
      companyName: body.companyName,
      companyNumber: body.companyNumber,
      registeredAddress: body.registeredAddress,
      vatNumber: body.vatNumber,
      directorName: body.directorName,
    });

    if (!profile) {
      return NextResponse.json({ error: "Unable to save tax profile." }, { status: 500 });
    }

    const connect = await createConnectAccountLink(auth.user.id);
    if ("error" in connect) {
      return NextResponse.json({ success: true, profile, error: connect.error });
    }

    return NextResponse.json({ success: true, profile, connectUrl: connect.url });
  } catch {
    return NextResponse.json({ error: "Invalid tax registration." }, { status: 400 });
  }
}
