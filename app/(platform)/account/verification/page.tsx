import { VerificationHubPage } from "@/features/account-center/components/VerificationHubPage";
import { getProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Verification · ROVEXO",
};

export default async function AccountVerificationPage() {
  try {
    await getProfile();
  } catch {
    return (
      <VerificationHubPage
        backHref="/account/settings"
        backLabel="Settings"
        context="account"
        loadFailed
      />
    );
  }
  return (
    <VerificationHubPage backHref="/account/settings" backLabel="Settings" context="account" />
  );
}
