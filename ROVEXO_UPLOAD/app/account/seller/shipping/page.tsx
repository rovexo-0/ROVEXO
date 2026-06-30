import { redirect } from "next/navigation";
import { AccountSellerShippingPage } from "@/features/account/components/AccountSellerShippingPage";
import { getProfile } from "@/lib/profile/data";

export const metadata = { title: "Seller Shipping Settings" };

export default async function AccountSellerShippingRoute() {
  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }
  return <AccountSellerShippingPage />;
}
