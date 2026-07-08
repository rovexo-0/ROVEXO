import { SettingsV1 } from "@/features/account-module/components/SettingsV1";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Settings | ROVEXO",
  description: "Profile, security, privacy, and account preferences.",
};

export default function AccountSettingsRoute() {
  return <SettingsV1 />;
}
