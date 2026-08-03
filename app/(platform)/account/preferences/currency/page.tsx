import { AccountCurrencyPage } from "@/features/account/components/AccountCurrencyPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Currency | Settings | ROVEXO",
};

/** Currency lives under Settings — never on Personal Information. */
export default function AccountCurrencyRoute() {
  return <AccountCurrencyPage />;
}
