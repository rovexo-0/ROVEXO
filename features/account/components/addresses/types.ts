/**
 * Addresses v1.0 — shared types (single module).
 */

import type { UserAddress } from "@/lib/addresses/repository";
import type { AddressUiScope } from "@/lib/addresses/canonical";

export type AddressesBusinessProfile = {
  businessName: string | null;
  companyNumber: string | null;
  vatRegistered?: boolean;
};

export type UkLookupResult = {
  id: string;
  line1: string;
  line2: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  label: string;
};

export type AddressesPageProps = {
  initialScope?: AddressUiScope;
  isBusinessVerified?: boolean;
  businessProfile?: AddressesBusinessProfile | null;
};

export type AddressCardModel = {
  address: UserAddress;
  scope: AddressUiScope;
  displayName: string;
  vatRegistered?: boolean;
};
