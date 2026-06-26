import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Bot,
  CircleHelp,
  FileText,
  Grid3x3,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  List,
  MapPin,
  Package,
  Percent,
  Scale,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";

export function resolveMenuIcon(href: string): LucideIcon {
  if (href === "/orders" || href.startsWith("/orders")) return Package;
  if (href === "/saved") return Heart;
  if (href.startsWith("/trust")) return Shield;
  if (href.startsWith("/resolution")) return Scale;
  if (href.startsWith("/assistant")) return Bot;
  if (href.startsWith("/support")) return LifeBuoy;
  if (href.startsWith("/plans")) return Sparkles;
  if (href.startsWith("/categories") || href.startsWith("/category")) return Grid3x3;
  if (href === "/cart") return ShoppingCart;
  if (href.startsWith("/search")) return Search;
  if (href.includes("deals")) return Percent;
  if (href.startsWith("/seller/dashboard")) return LayoutDashboard;
  if (href.startsWith("/seller/listings")) return List;
  if (href.startsWith("/seller/orders")) return Truck;
  if (href.startsWith("/seller/wallet")) return Wallet;
  if (href.startsWith("/seller/analytics")) return BarChart3;
  if (href.startsWith("/seller/trust")) return Shield;
  if (href.startsWith("/seller/tax")) return FileText;
  if (href.startsWith("/sell")) return Store;
  if (href.startsWith("/notifications")) return Bell;
  if (href.startsWith("/help/faq")) return CircleHelp;
  if (href.startsWith("/help/policies")) return FileText;
  if (href.startsWith("/help")) return HelpCircle;
  if (href.startsWith("/account/settings") || href.startsWith("/settings")) return Settings;
  if (href === "/legal") return Tag;
  if (href.startsWith("/account")) return Settings;
  return ShoppingBag;
}
