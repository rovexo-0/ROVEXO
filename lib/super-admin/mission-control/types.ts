export type MissionControlServiceStatus = "online" | "warning" | "offline";

export type MissionControlNotificationSeverity =
  | "info"
  | "success"
  | "warning"
  | "high"
  | "critical"
  | "emergency";

export type MissionControlModule = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  category: "home" | "commerce" | "content" | "people" | "platform" | "insights";
  badge?: number;
};

export type MissionControlService = {
  id: string;
  label: string;
  status: MissionControlServiceStatus;
  detail?: string;
};

export type MissionControlCounter = {
  id: string;
  label: string;
  value: number;
  delta?: number;
  href?: string;
};

export type HomepageBuilderComponentId =
  | "header"
  | "search"
  | "top-category-bar"
  | "category-rail"
  | "bring-items"
  | "hero-slider"
  | "featured-listings"
  | "recommended"
  | "new-listings"
  | "latest-listings"
  | "recently-listed"
  | "popular-auctions"
  | "business-spotlight"
  | "continue-browsing"
  | "trending-searches"
  | "footer"
  | "bottom-navigation";

export type HomepageComponentStyle = {
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
  margin?: number;
  gap?: number;
  borderRadius?: number;
  shadow?: number;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  iconSize?: number;
  imageSize?: number;
  columns?: number;
  rows?: number;
  spacing?: number;
  alignment?: "start" | "center" | "end";
};

export type HomepageBuilderComponent = {
  id: HomepageBuilderComponentId;
  label: string;
  enabled: boolean;
  published: boolean;
  order: number;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  style: HomepageComponentStyle;
};

export type HomepageBuilderConfig = {
  version: number;
  updatedAt: string;
  components: HomepageBuilderComponent[];
};

export type MissionControlFeatureToggle = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  state: "live" | "beta" | "coming-soon" | "maintenance";
  version: string;
};

export type MissionControlAiToggle = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  execution: "local" | "server" | "hybrid";
};

export type BannerManagerItem = {
  id: string;
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  image?: string;
  enabled: boolean;
  published: boolean;
  order: number;
  transitionMs: number;
};

export type BannerManagerConfig = {
  version: number;
  updatedAt: string;
  banners: BannerManagerItem[];
};

export type MissionControlSnapshot = {
  scannedAt: string;
  modules: MissionControlModule[];
  services: MissionControlService[];
  counters: MissionControlCounter[];
  homepageBuilder: HomepageBuilderConfig;
  banners: BannerManagerConfig;
  features: MissionControlFeatureToggle[];
  ai: {
    globalEnabled: boolean;
    features: MissionControlAiToggle[];
  };
  platformHealth: "online" | "warning" | "offline";
};
