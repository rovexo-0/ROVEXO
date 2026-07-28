import { permanentRedirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy path — permanent redirect to canonical `/promote` (SSOT). */
export default async function PromotionToolsLegacyRedirect({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
  }
  const query = qs.toString();
  permanentRedirect(query ? `/promote?${query}` : "/promote");
}
