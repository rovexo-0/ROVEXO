import { MyAccountTemplate } from "@/features/account-canonical";
import { SettingsAboutV1 } from "@/features/account-module/components/SettingsAboutV1";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "About | Settings | ROVEXO",
};

export default function SettingsAboutRoute() {
  return (
    <MyAccountTemplate surface="settings" title="About" backHref="/account/settings">
      <SettingsAboutV1 />
    </MyAccountTemplate>
  );
}
