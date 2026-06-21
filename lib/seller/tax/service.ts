import { createAdminClient } from "@/lib/supabase/admin";
import type { SellerRegistrationType, SellerTaxProfile } from "@/lib/seller/tax/types";

function mapProfile(row: Record<string, unknown>): SellerTaxProfile {
  return {
    sellerId: String(row.seller_id),
    registrationType: row.registration_type as SellerRegistrationType,
    fullName: row.full_name ? String(row.full_name) : null,
    addressLine1: row.address_line1 ? String(row.address_line1) : null,
    addressLine2: row.address_line2 ? String(row.address_line2) : null,
    city: row.city ? String(row.city) : null,
    postcode: row.postcode ? String(row.postcode) : null,
    country: String(row.country ?? "GB"),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    nino: row.nino ? String(row.nino) : null,
    utr: row.utr ? String(row.utr) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    companyNumber: row.company_number ? String(row.company_number) : null,
    registeredAddress: row.registered_address ? String(row.registered_address) : null,
    vatNumber: row.vat_number ? String(row.vat_number) : null,
    directorName: row.director_name ? String(row.director_name) : null,
    stripeConnectCompleted: Boolean(row.stripe_connect_completed),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
  };
}

export async function getSellerTaxProfile(sellerId: string): Promise<SellerTaxProfile | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("seller_tax_profiles")
    .select("*")
    .eq("seller_id", sellerId)
    .maybeSingle();

  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function upsertSellerTaxProfile(input: {
  sellerId: string;
  registrationType: SellerRegistrationType;
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
  nino?: string;
  utr?: string;
  companyName?: string;
  companyNumber?: string;
  registeredAddress?: string;
  vatNumber?: string;
  directorName?: string;
  stripeConnectCompleted?: boolean;
}): Promise<SellerTaxProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seller_tax_profiles")
    .upsert({
      seller_id: input.sellerId,
      registration_type: input.registrationType,
      full_name: input.fullName ?? null,
      address_line1: input.addressLine1 ?? null,
      address_line2: input.addressLine2 ?? null,
      city: input.city ?? null,
      postcode: input.postcode ?? null,
      country: input.country ?? "GB",
      email: input.email ?? null,
      phone: input.phone ?? null,
      nino: input.nino ?? null,
      utr: input.utr ?? null,
      company_name: input.companyName ?? null,
      company_number: input.companyNumber ?? null,
      registered_address: input.registeredAddress ?? null,
      vat_number: input.vatNumber ?? null,
      director_name: input.directorName ?? null,
      stripe_connect_completed: input.stripeConnectCompleted ?? false,
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfile(data as Record<string, unknown>);
}
