import { StoreUnavailablePage } from "@/components/store/StoreUnavailablePage";
import { FollowListPage } from "@/features/profile/components/FollowListPage";
import { resolveFollowListTarget } from "@/lib/follow/resolve-follow-list-target-v1";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function UserFollowingPage({ params }: PageProps) {
  const { username } = await params;
  const target = await resolveFollowListTarget(username);
  if (!target) return <StoreUnavailablePage kind="store" />;

  return (
    <FollowListPage
      userId={target.userId}
      username={target.username}
      mode="following"
      backHref={`/user/${encodeURIComponent(target.username)}`}
    />
  );
}
