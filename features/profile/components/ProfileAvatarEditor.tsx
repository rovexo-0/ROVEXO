"use client";

import { useRouter } from "next/navigation";
import { MyAccountTemplate, AccountPageStack } from "@/features/account-canonical";
import { CanonicalInfoBlock } from "@/src/components/canonical";
import { AvatarUploader } from "@/features/account/components/AvatarUploader";
import { useToast } from "@/components/ui/Toast";
import "@/styles/rovexo/account-settings-v1.css";

type ProfileAvatarEditorProps = {
  name: string;
  avatarUrl: string | null;
  returnTo: string;
};

/**
 * My Profile v8.0 — Change Profile Picture (single entry: /account/profile/avatar).
 */
export function ProfileAvatarEditor({ name, avatarUrl, returnTo }: ProfileAvatarEditorProps) {
  const router = useRouter();
  const { pushToast } = useToast();

  return (
    <MyAccountTemplate
      surface="personal-information"
      title="Change Profile Picture"
      backHref={returnTo}
      backLabel="Profile"
      showHeaderTitle
    >
      <AccountPageStack className="fw-engine__stack" aria-label="Change Profile Picture">
        <div data-profile-avatar="v8.0" className="flex w-full flex-col gap-[var(--cds-space-section-gap)]">
          <CanonicalInfoBlock variant="description">
            Take a photo or choose from your gallery. You can crop before saving.
          </CanonicalInfoBlock>
          <AvatarUploader
            name={name}
            avatarUrl={avatarUrl}
            accountSettings
            onUpdated={(next) => {
              pushToast({
                title: next ? "Photo updated." : "Photo removed.",
                variant: "success",
              });
              router.push(returnTo);
              router.refresh();
            }}
          />
        </div>
      </AccountPageStack>
    </MyAccountTemplate>
  );
}
