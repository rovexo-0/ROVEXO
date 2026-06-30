import { getProfile } from "@/lib/profile/data";
import type { UserProfile } from "@/lib/profile/types";

export async function fetchProfile(): Promise<UserProfile> {
  return getProfile();
}
