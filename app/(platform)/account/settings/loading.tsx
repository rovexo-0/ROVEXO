import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { MyAccountTemplate } from "@/features/account-canonical";

export default function AccountSettingsLoading() {
  return (
    <MyAccountTemplate
      surface="settings"
      title="Settings"
      backHref="/account"
      showHeaderTitle
      showBottomNav={false}
    >
      <AccountModuleSkeleton />
    </MyAccountTemplate>
  );
}
