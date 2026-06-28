import type {
  VisualCmsBuilder,
  VisualCmsCanvasElement,
  VisualCmsCanvasElementId,
  VisualCmsBuilderId,
} from "@/lib/visual-cms-engine/types";

export const VISUAL_CMS_BUILDERS: VisualCmsBuilder[] = [
  { id: "homepage-builder", label: "Homepage Builder", icon: "🏠", description: "Visual homepage editor", href: "/super-admin/homepage-builder", category: "layout" },
  { id: "landing-page-builder", label: "Landing Page Builder", icon: "🚀", description: "Marketing landing pages", href: "/super-admin/visual-cms?builder=landing-page-builder", category: "layout" },
  { id: "header-builder", label: "Header Builder", icon: "📐", description: "Global header layout", href: "/super-admin/theme-studio", category: "layout" },
  { id: "footer-builder", label: "Footer Builder", icon: "📄", description: "Footer layout and links", href: "/super-admin/theme-studio", category: "layout" },
  { id: "desktop-navigation-builder", label: "Desktop Navigation", icon: "🖥️", description: "Desktop navigation menus", href: "/super-admin/menu-builder", category: "layout" },
  { id: "mobile-navigation-builder", label: "Mobile Navigation", icon: "📱", description: "Mobile bottom navigation", href: "/super-admin/menu-builder", category: "layout" },
  { id: "search-bar-builder", label: "Search Bar Builder", icon: "🔍", description: "Search bar styling", href: "/super-admin/theme-studio", category: "layout" },
  { id: "hero-banner-builder", label: "Hero Banner Builder", icon: "🖼️", description: "Hero slider campaigns", href: "/super-admin/banners", category: "layout" },
  { id: "categories-builder", label: "Categories Builder", icon: "📁", description: "Category rails and icons", href: "/super-admin/category-management", category: "layout" },
  { id: "product-card-builder", label: "Product Card Builder", icon: "🏷️", description: "Product card templates", href: "/super-admin/visual-cms?builder=product-card-builder", category: "commerce" },
  { id: "listing-card-builder", label: "Listing Card Builder", icon: "📋", description: "Listing card templates", href: "/super-admin/visual-cms?builder=listing-card-builder", category: "commerce" },
  { id: "seller-profile-builder", label: "Seller Profile Builder", icon: "🛍️", description: "Seller profile surfaces", href: "/super-admin/visual-cms?builder=seller-profile-builder", category: "account" },
  { id: "buyer-profile-builder", label: "Buyer Profile Builder", icon: "🛒", description: "Buyer profile surfaces", href: "/super-admin/visual-cms?builder=buyer-profile-builder", category: "account" },
  { id: "business-profile-builder", label: "Business Profile Builder", icon: "🏢", description: "Business storefront pages", href: "/super-admin/visual-cms?builder=business-profile-builder", category: "account" },
  { id: "wallet-interface-builder", label: "Wallet Interface Builder", icon: "💰", description: "Wallet UI templates", href: "/super-admin/visual-cms?builder=wallet-interface-builder", category: "commerce" },
  { id: "orders-interface-builder", label: "Orders Interface Builder", icon: "📦", description: "Orders UI templates", href: "/super-admin/visual-cms?builder=orders-interface-builder", category: "commerce" },
  { id: "checkout-builder", label: "Checkout Builder", icon: "💳", description: "Checkout flow shell", href: "/super-admin/visual-cms?builder=checkout-builder", category: "commerce" },
  { id: "messages-builder", label: "Messages Builder", icon: "💬", description: "Messaging UI templates", href: "/super-admin/visual-cms?builder=messages-builder", category: "system" },
  { id: "notifications-builder", label: "Notifications Builder", icon: "🔔", description: "Notification UI templates", href: "/super-admin/visual-cms?builder=notifications-builder", category: "system" },
  { id: "empty-state-builder", label: "Empty State Builder", icon: "🖼️", description: "Empty state illustrations", href: "/super-admin/premium-design", category: "system" },
  { id: "modal-builder", label: "Modal Builder", icon: "🪟", description: "Modal overlays", href: "/super-admin/visual-cms?builder=modal-builder", category: "system" },
  { id: "dialog-builder", label: "Dialog Builder", icon: "💬", description: "Dialog components", href: "/super-admin/visual-cms?builder=dialog-builder", category: "system" },
  { id: "popup-builder", label: "Popup Builder", icon: "📣", description: "Promotional popups", href: "/super-admin/visual-cms?builder=popup-builder", category: "system" },
  { id: "footer-links-builder", label: "Footer Links Builder", icon: "🔗", description: "Footer link groups", href: "/super-admin/menu-builder", category: "layout" },
  { id: "theme-variables-builder", label: "Theme Variables Builder", icon: "🎨", description: "Design tokens and variables", href: "/super-admin/theme-manager", category: "theme" },
];

export const VISUAL_CMS_CANVAS_ELEMENTS: VisualCmsCanvasElement[] = [
  { id: "container", label: "Container", icon: "📦", category: "layout" },
  { id: "section", label: "Section", icon: "▭", category: "layout" },
  { id: "column", label: "Column", icon: "▯", category: "layout" },
  { id: "grid", label: "Grid", icon: "⊞", category: "layout" },
  { id: "flex-layout", label: "Flex Layout", icon: "↔", category: "layout" },
  { id: "text", label: "Text", icon: "T", category: "content" },
  { id: "button", label: "Button", icon: "🔘", category: "content" },
  { id: "card", label: "Card", icon: "🃏", category: "content" },
  { id: "form", label: "Form", icon: "📝", category: "content" },
  { id: "search-bar", label: "Search Bar", icon: "🔍", category: "content" },
  { id: "icon", label: "Icon", icon: "✨", category: "media" },
  { id: "svg", label: "SVG", icon: "◇", category: "media" },
  { id: "png", label: "PNG", icon: "🖼️", category: "media" },
  { id: "webp", label: "WEBP", icon: "🖼️", category: "media" },
  { id: "jpg", label: "JPG", icon: "🖼️", category: "media" },
  { id: "gif", label: "GIF", icon: "🎞️", category: "media" },
  { id: "lottie", label: "Lottie", icon: "🎬", category: "media" },
  { id: "emoji", label: "Emoji", icon: "😀", category: "media" },
  { id: "sticker", label: "Sticker", icon: "🏷️", category: "media" },
  { id: "flag", label: "Flag", icon: "🏳️", category: "media" },
  { id: "logo", label: "Logo", icon: "🏷️", category: "media" },
  { id: "video", label: "Video", icon: "🎥", category: "media" },
  { id: "background-image", label: "Background Image", icon: "🌄", category: "decoration" },
  { id: "gradient", label: "Gradient", icon: "🌈", category: "decoration" },
  { id: "shadow", label: "Shadow", icon: "🌑", category: "decoration" },
  { id: "border", label: "Border", icon: "▢", category: "decoration" },
  { id: "divider", label: "Divider", icon: "—", category: "decoration" },
  { id: "spacer", label: "Spacer", icon: "↕", category: "decoration" },
  { id: "html-block", label: "HTML Block", icon: "⟨/⟩", category: "content" },
  { id: "markdown-block", label: "Markdown Block", icon: "MD", category: "content" },
];

export const VISUAL_CMS_BUILDER_IDS = VISUAL_CMS_BUILDERS.map((b) => ({ id: b.id, label: b.label }));
export const VISUAL_CMS_CANVAS_ELEMENT_IDS = VISUAL_CMS_CANVAS_ELEMENTS.map((e) => ({ id: e.id, label: e.label }));

export function registerVisualCmsBuilder(builder: VisualCmsBuilder): VisualCmsBuilder[] {
  const index = VISUAL_CMS_BUILDERS.findIndex((item) => item.id === builder.id);
  if (index >= 0) {
    const next = [...VISUAL_CMS_BUILDERS];
    next[index] = builder;
    return next;
  }
  return [...VISUAL_CMS_BUILDERS, builder];
}

export function registerVisualCmsCanvasElement(element: VisualCmsCanvasElement): VisualCmsCanvasElement[] {
  const index = VISUAL_CMS_CANVAS_ELEMENTS.findIndex((item) => item.id === element.id);
  if (index >= 0) {
    const next = [...VISUAL_CMS_CANVAS_ELEMENTS];
    next[index] = element;
    return next;
  }
  return [...VISUAL_CMS_CANVAS_ELEMENTS, element];
}

export function getVisualCmsBuilder(id: VisualCmsBuilderId | string): VisualCmsBuilder | undefined {
  return VISUAL_CMS_BUILDERS.find((item) => item.id === id);
}

export function getVisualCmsCanvasElement(id: VisualCmsCanvasElementId | string): VisualCmsCanvasElement | undefined {
  return VISUAL_CMS_CANVAS_ELEMENTS.find((item) => item.id === id);
}
