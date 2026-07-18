import { VerificationHubPage } from "@/features/account-center/components/VerificationHubPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Verification · ROVEXO",
};

export default async function AccountVerificationPage() {
  await getProfile();
  return <VerificationHubPage backHref="/account" backLabel="My Account" context="account" />;
}
