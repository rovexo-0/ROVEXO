"use client";

import { useParams } from "next/navigation";
import { FollowListLoadingShell } from "@/features/profile/components/FollowListLoadingShell";

export default function UserFollowingLoading() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";
  return <FollowListLoadingShell mode="following" username={username} />;
}
