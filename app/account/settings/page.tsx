import { Suspense } from "react";
import { SettingsV1 } from "@/features/account-module/components/SettingsV1";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Settings | ROVEXO",
  description: "Profile, security, privacy, and account preferences.",
};

export default function AccountSettingsRoute() {
  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading settings…</div>}>
      <SettingsV1 />
    </Suspense>
  );
}
