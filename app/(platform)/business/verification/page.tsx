import { VerificationHubPage } from "@/features/account-center/components/VerificationHubPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Business Verification · ROVEXO",
};

/** Business Verification — stays in Business (never opens My Account). */
export default async function BusinessVerificationPage() {
  await getProfile();
  return (
    <VerificationHubPage
      backHref="/business/dashboard"
      backLabel="Business"
      context="business"
    />
  );
}
