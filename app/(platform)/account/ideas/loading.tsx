import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { MyAccountTemplate } from "@/features/account-canonical";

/**
 * P0.4 — Ideas matches Settings reference loading chrome.
 */
export default function AccountIdeasLoading() {
  return (
    <MyAccountTemplate
      surface="ideas"
      title="Rovexo Ideas"
      backHref="/account"
      showHeaderTitle
      showBottomNav
      bottomNavTab="account"
    >
      <AccountModuleSkeleton />
    </MyAccountTemplate>
  );
}
