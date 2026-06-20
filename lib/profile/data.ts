import { redirect } from "next/navigation";
import { fetchCurrentProfile } from "@/lib/profile/repository";
import type { UserProfile } from "@/lib/profile/types";

export async function getProfile(): Promise<UserProfile> {
  const profile = await fetchCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function getBusinessProfile(): Promise<UserProfile> {
  const profile = await getProfile();

  if (profile.accountType !== "business") {
    throw new Error("Business account required");
  }

  return profile;
}