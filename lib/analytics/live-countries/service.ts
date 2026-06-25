import { fetchGa4LiveCountries, isGa4RealtimeEnabled } from "@/lib/analytics/live-countries/ga4-realtime";
import { getPlatformLiveCountries } from "@/lib/analytics/live-countries/platform";
import type { LiveCountriesSnapshot } from "@/lib/analytics/live-countries/types";

export async function getLiveCountriesSnapshot(): Promise<LiveCountriesSnapshot> {
  const updatedAt = new Date().toISOString();

  if (isGa4RealtimeEnabled()) {
    const ga4Countries = await fetchGa4LiveCountries();
    if (ga4Countries) {
      return {
        countries: ga4Countries,
        source: "ga4",
        updatedAt,
      };
    }
  }

  const platformCountries = await getPlatformLiveCountries();
  return {
    countries: platformCountries,
    source: "platform",
    updatedAt,
  };
}
