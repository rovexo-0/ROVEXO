import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { SettingsAboutV1 } from "@/features/account-module/components/SettingsAboutV1";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "About | Settings | ROVEXO",
};

export default function SettingsAboutRoute() {
  return (
    <AccountModuleShell title="About" backHref="/account/settings" version="v2.0-02b">
      <SettingsAboutV1 />
    </AccountModuleShell>
  );
}
