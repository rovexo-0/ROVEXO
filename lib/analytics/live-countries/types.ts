export type LiveCountry = {
  code: string;
  name: string;
  flag: string;
  activeUsers: number;
};

export type LiveCountriesSnapshot = {
  countries: LiveCountry[];
  source: "ga4" | "platform";
  updatedAt: string;
};
