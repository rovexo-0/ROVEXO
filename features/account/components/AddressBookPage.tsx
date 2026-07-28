/**
 * Addresses v1.0 SSOT — re-exports AddressesPage (no duplicate UI).
 * Prefer importing AddressesPage from `@/features/account/components/addresses`.
 */
export {
  AddressesPage as AddressBookPage,
  type AddressesPageProps as AddressBookPageProps,
  type AddressesBusinessProfile as AddressBookBusinessProfile,
} from "@/features/account/components/addresses";
