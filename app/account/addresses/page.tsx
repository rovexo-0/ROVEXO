import { Suspense } from "react";
import { AddressBookPage } from "@/features/account/components/AddressBookPage";

export const metadata = {
  title: "Addresses",
};

export default function AccountAddressesRoute() {
  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading addresses…</div>}>
      <AddressBookPage />
    </Suspense>
  );
}
