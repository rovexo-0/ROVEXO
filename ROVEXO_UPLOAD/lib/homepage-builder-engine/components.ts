import type { HomepageComponent, HomepageComponentType } from "@/lib/homepage-builder-engine/types";
import { HOMEPAGE_COMPONENT_TYPES } from "@/lib/homepage-builder-engine/registry";

const COMPONENT_LABELS: Record<HomepageComponentType, string> = {
  button: "Button",
  card: "Card",
  "product-card": "Product Card",
  "auction-card": "Auction Card",
  "seller-card": "Seller Card",
  "business-card": "Business Card",
  "review-card": "Review Card",
  chart: "Chart",
  statistics: "Statistics",
  countdown: "Countdown",
  gallery: "Gallery",
  carousel: "Carousel",
  video: "Video",
  image: "Image",
  badge: "Badge",
  form: "Form",
  pricing: "Pricing",
  faq: "FAQ",
  announcement: "Announcement",
  widget: "Widget",
};

export function createComponent(type: HomepageComponentType): HomepageComponent {
  return {
    id: `comp-${type}`,
    type,
    label: COMPONENT_LABELS[type],
    reusable: true,
    config: {},
  };
}

export function createDefaultComponentLibrary(): HomepageComponent[] {
  return HOMEPAGE_COMPONENT_TYPES.map((type) => createComponent(type));
}

export function getComponentLabel(type: HomepageComponentType): string {
  return COMPONENT_LABELS[type];
}

export function findComponent(components: HomepageComponent[], id: string): HomepageComponent | undefined {
  return components.find((c) => c.id === id);
}

export function registerComponent(
  components: HomepageComponent[],
  component: HomepageComponent,
): HomepageComponent[] {
  const index = components.findIndex((c) => c.id === component.id);
  if (index >= 0) {
    const next = [...components];
    next[index] = component;
    return next;
  }
  return [...components, component];
}
