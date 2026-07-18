import { redirect } from "next/navigation";

type BusinessCenterPageProps = {
  profile?: unknown;
  companyName?: string;
  storeSlug?: string;
  verifiedBusiness?: boolean;
  verifiedWholesale?: boolean;
  verifiedManufacturer?: boolean;
  verifiedSupplier?: boolean;
  trustScore?: number;
};

/** @deprecated Unrouted legacy hub — canonical entry is /business/dashboard */
export function BusinessCenterPage(_props: BusinessCenterPageProps): never {
  redirect("/business/dashboard");
}
