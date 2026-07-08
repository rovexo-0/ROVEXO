import type { UserRole } from "@/lib/supabase/types/database";
import {
  resolveOfficialDemoBannerImage,
  resolveOfficialDemoProductImage,
} from "@/lib/media/official-demo-images";

export { resolveOfficialDemoProductImage, resolveOfficialDemoBannerImage };
export {
  resolveOfficialDemoProductImage as demoProductImageUrl,
  resolveOfficialDemoBannerImage as demoBannerUrl,
} from "@/lib/media/official-demo-images";

export const DEMO_EMAIL_DOMAIN = "demo.rovexo.co.uk";

export const DEMO_DEFAULT_PASSWORD = "RovexoDemo2026!";

export const DEMO_LISTING_TARGET = 300;

export type DemoUserDefinition = {
  key: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  businessName?: string;
  phone?: string;
  avatarSeed: string;
};

export const DEMO_USERS: DemoUserDefinition[] = [
  {
    key: "buyer01",
    email: `buyer01@${DEMO_EMAIL_DOMAIN}`,
    username: "buyer01",
    fullName: "Demo Buyer One",
    role: "buyer",
    phone: "+447700900101",
    avatarSeed: "buyer01",
  },
  {
    key: "buyer02",
    email: `buyer02@${DEMO_EMAIL_DOMAIN}`,
    username: "buyer02",
    fullName: "Demo Buyer Two",
    role: "buyer",
    phone: "+447700900102",
    avatarSeed: "buyer02",
  },
  {
    key: "seller01",
    email: `seller01@${DEMO_EMAIL_DOMAIN}`,
    username: "seller01",
    fullName: "Demo Seller One",
    role: "seller",
    phone: "+447700900201",
    avatarSeed: "seller01",
  },
  {
    key: "seller02",
    email: `seller02@${DEMO_EMAIL_DOMAIN}`,
    username: "seller02",
    fullName: "Demo Seller Two",
    role: "seller",
    phone: "+447700900202",
    avatarSeed: "seller02",
  },
  {
    key: "seller03",
    email: `seller03@${DEMO_EMAIL_DOMAIN}`,
    username: "seller03",
    fullName: "Demo Seller Three",
    role: "seller",
    phone: "+447700900203",
    avatarSeed: "seller03",
  },
  {
    key: "seller04",
    email: `seller04@${DEMO_EMAIL_DOMAIN}`,
    username: "seller04",
    fullName: "Demo Seller Four",
    role: "seller",
    phone: "+447700900204",
    avatarSeed: "seller04",
  },
  {
    key: "business01",
    email: `business01@${DEMO_EMAIL_DOMAIN}`,
    username: "business01",
    fullName: "Demo Business One",
    role: "business",
    businessName: "Demo Business One Ltd",
    phone: "+447700900301",
    avatarSeed: "business01",
  },
  {
    key: "business02",
    email: `business02@${DEMO_EMAIL_DOMAIN}`,
    username: "business02",
    fullName: "Demo Business Two",
    role: "business",
    businessName: "Demo Business Two Ltd",
    phone: "+447700900302",
    avatarSeed: "business02",
  },
  {
    key: "admin",
    email: `admin@${DEMO_EMAIL_DOMAIN}`,
    username: "demo_admin",
    fullName: "Demo Platform Admin",
    role: "admin",
    phone: "+447700900401",
    avatarSeed: "demo-admin",
  },
  {
    key: "superadmin",
    email: `superadmin@${DEMO_EMAIL_DOMAIN}`,
    username: "demo_superadmin",
    fullName: "Demo Super Admin",
    role: "super_admin",
    phone: "+447700900501",
    avatarSeed: "demo-superadmin",
  },
];

export function demoAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/png?seed=${encodeURIComponent(seed)}`;
}

export function resolveDemoSeedPassword(): string {  return process.env.DEMO_SEED_PASSWORD?.trim() || DEMO_DEFAULT_PASSWORD;
}

export function isDemoSeedEnabled(): boolean {
  if (process.env.DEMO_SEED_ENABLED === "1" || process.env.DEMO_SEED_ENABLED === "true") {
    return true;
  }
  if (process.env.NODE_ENV === "production" && process.env.DEMO_ALLOW_PRODUCTION !== "1") {
    return false;
  }
  return process.env.VITEST === "true" || process.env.NODE_ENV !== "production";
}
