import { VerificationHubV1 } from "@/features/account-module/components/VerificationHubV1";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Verification | ROVEXO",
  description: "Identity, business, and tax verification for your ROVEXO account.",
};

export default function AccountVerificationRoute() {
  return <VerificationHubV1 />;
}
