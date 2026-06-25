import type {
  LiveAnalyticsFilters,
  LiveAnalyticsSnapshot,
} from "@/lib/analytics/live-center/types";

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function applyLiveAnalyticsFilters(
  snapshot: LiveAnalyticsSnapshot,
  filters: LiveAnalyticsFilters,
): LiveAnalyticsSnapshot {
  const query = filters.query.trim();

  const countries = snapshot.countries.filter((country) => {
    if (filters.country && country.code !== filters.country && country.name !== filters.country) {
      return false;
    }
    if (query && !matchesQuery(country.name, query) && !matchesQuery(country.code, query)) {
      return false;
    }
    return true;
  });

  const cities = snapshot.cities.filter((city) => {
    if (filters.country && city.countryCode !== filters.country && city.countryName !== filters.country) {
      return false;
    }
    if (query && !matchesQuery(city.name, query) && !matchesQuery(city.countryName, query)) {
      return false;
    }
    return true;
  });

  const browsers = snapshot.browsers.filter((row) => {
    if (filters.browser && row.label !== filters.browser) return false;
    if (query && !matchesQuery(row.label, query)) return false;
    return true;
  });

  const devices = snapshot.devices.filter((row) => {
    if (filters.device && row.label !== filters.device) return false;
    if (query && !matchesQuery(row.label, query)) return false;
    return true;
  });

  const operatingSystems = snapshot.operatingSystems.filter((row) => {
    if (filters.operatingSystem && row.label !== filters.operatingSystem) return false;
    if (query && !matchesQuery(row.label, query)) return false;
    return true;
  });

  const trafficSources = snapshot.trafficSources.filter((row) => {
    if (filters.trafficSource && row.label !== filters.trafficSource) return false;
    if (query && !matchesQuery(row.label, query)) return false;
    return true;
  });

  const events = filters.liveOnly
    ? snapshot.events
    : snapshot.events.filter((event) => {
        if (!filters.date) return true;
        return event.timestamp.slice(0, 10) === filters.date;
      });

  return {
    ...snapshot,
    countries,
    cities,
    browsers,
    devices,
    operatingSystems,
    trafficSources,
    events,
  };
}

export function buildFilterOptions(snapshot: LiveAnalyticsSnapshot) {
  return {
    countries: snapshot.countries.map((country) => ({ value: country.code, label: country.name })),
    browsers: snapshot.browsers.map((row) => ({ value: row.label, label: row.label })),
    operatingSystems: snapshot.operatingSystems.map((row) => ({ value: row.label, label: row.label })),
    devices: snapshot.devices.map((row) => ({ value: row.label, label: row.label })),
    trafficSources: snapshot.trafficSources.map((row) => ({ value: row.label, label: row.label })),
  };
}
