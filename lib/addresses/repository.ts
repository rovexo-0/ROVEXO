import { createClient } from "@/lib/supabase/server";
import type { AddressInput } from "@/lib/account/schemas";
import { sanitizeOptionalText, sanitizeText } from "@/lib/account/sanitize";

export type UserAddress = {
  id: string;
  recipientName: string;
  addressLine: string;
  addressLine2: string | null;
  city: string | null;
  postcode: string;
  country: string;
  addressType: "shipping" | "billing";
  isDefault: boolean;
};

type AddressRow = {
  id: string;
  recipient_name: string;
  address_line: string;
  address_line_2: string | null;
  city: string | null;
  postcode: string;
  country: string;
  address_type: string;
  is_default: boolean;
};

function mapRow(row: AddressRow): UserAddress {
  return {
    id: row.id,
    recipientName: row.recipient_name,
    addressLine: row.address_line,
    addressLine2: row.address_line_2,
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    addressType: row.address_type as UserAddress["addressType"],
    isDefault: row.is_default,
  };
}

export async function listUserAddresses(
  userId: string,
  addressType?: "shipping" | "billing",
): Promise<UserAddress[]> {
  const supabase = await createClient();
  let query = supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (addressType) {
    query = query.eq("address_type", addressType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as AddressRow[]).map(mapRow);
}

export async function getDefaultAddress(
  userId: string,
  addressType: "shipping" | "billing",
): Promise<UserAddress | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .eq("address_type", addressType)
    .eq("is_default", true)
    .maybeSingle();

  return data ? mapRow(data as AddressRow) : null;
}

async function clearDefaultAddresses(
  userId: string,
  addressType: "shipping" | "billing",
  exceptId?: string,
) {
  const supabase = await createClient();
  let query = supabase
    .from("shipping_addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("address_type", addressType);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  await query;
}

export async function createUserAddress(userId: string, input: AddressInput): Promise<UserAddress> {
  const supabase = await createClient();
  const addressType = input.addressType ?? "shipping";

  if (input.isDefault) {
    await clearDefaultAddresses(userId, addressType);
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert({
      user_id: userId,
      recipient_name: sanitizeText(input.recipientName),
      address_line: sanitizeText(input.addressLine),
      address_line_2: sanitizeOptionalText(input.addressLine2) ?? null,
      city: sanitizeOptionalText(input.city) ?? null,
      postcode: sanitizeText(input.postcode),
      country: sanitizeText(input.country),
      address_type: addressType,
      is_default: input.isDefault ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as AddressRow);
}

export async function updateUserAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
): Promise<UserAddress> {
  const supabase = await createClient();
  const addressType = input.addressType ?? "shipping";

  if (input.isDefault) {
    await clearDefaultAddresses(userId, addressType, addressId);
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .update({
      recipient_name: sanitizeText(input.recipientName),
      address_line: sanitizeText(input.addressLine),
      address_line_2: sanitizeOptionalText(input.addressLine2) ?? null,
      city: sanitizeOptionalText(input.city) ?? null,
      postcode: sanitizeText(input.postcode),
      country: sanitizeText(input.country),
      address_type: addressType,
      is_default: input.isDefault ?? false,
    })
    .eq("id", addressId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as AddressRow);
}

export async function deleteUserAddress(userId: string, addressId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function setDefaultAddress(
  userId: string,
  addressId: string,
): Promise<UserAddress> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("shipping_addresses")
    .select("address_type")
    .eq("id", addressId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    throw new Error("Address not found");
  }

  const addressType = existing.address_type as "shipping" | "billing";
  await clearDefaultAddresses(userId, addressType, addressId);

  const { data, error } = await supabase
    .from("shipping_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as AddressRow);
}
