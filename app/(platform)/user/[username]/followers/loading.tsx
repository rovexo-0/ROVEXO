"use client";

import { useParams } from "next/navigation";
import { FollowListLoadingShell } from "@/features/profile/components/FollowListLoadingShell";

export default function UserFollowersLoading() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";
  return <FollowListLoadingShell mode="followers" username={username} />;
}
