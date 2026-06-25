import type { ReactNode } from "react";
import { HeartIcon } from "@/features/product-detail/icons";
import {
  HelpMenuIcon,
  ListingsIcon,
  MessagesMenuIcon,
  NotificationsMenuIcon,
  OrdersMenuIcon,
  SalesIcon,
  SettingsIcon,
  WalletMenuIcon,
} from "@/features/profile/icons";

export function getNavLinkIcon(href: string, className = "h-5 w-5"): ReactNode {
  if (href === "/orders" || href === "/cart") {
    return <OrdersMenuIcon className={className} />;
  }
  if (href === "/saved") {
    return <HeartIcon className={`${className} text-danger`} filled />;
  }
  if (href.startsWith("/messages")) {
    return <MessagesMenuIcon className={className} />;
  }
  if (href.startsWith("/notifications")) {
    return <NotificationsMenuIcon className={className} />;
  }
  if (href.startsWith("/seller/wallet") || href === "/plans") {
    return <WalletMenuIcon className={className} />;
  }
  if (href.startsWith("/seller/analytics") || href.includes("analytics")) {
    return <SalesIcon className={className} />;
  }
  if (
    href.startsWith("/seller") ||
    href.startsWith("/sell") ||
    href.startsWith("/business")
  ) {
    return <ListingsIcon className={className} />;
  }
  if (href.startsWith("/settings") || href === "/legal") {
    return <SettingsIcon className={className} />;
  }
  if (
    href.startsWith("/help") ||
    href.startsWith("/assistant") ||
    href.startsWith("/trust") ||
    href.startsWith("/resolution") ||
    href.startsWith("/support")
  ) {
    return <HelpMenuIcon className={className} />;
  }
  return <HelpMenuIcon className={className} />;
}
