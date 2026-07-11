import { PROFILE_RETURN_TO_PARAM, sanitizeReturnToPath } from "@/lib/account/profile-completion";

export function readReturnToParam(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): string | null {
  const value = searchParams.get(PROFILE_RETURN_TO_PARAM);
  if (!value) return null;
  return sanitizeReturnToPath(value);
}
