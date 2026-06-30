import type { PlatformThemeTokens } from "@/lib/platform-visual/types";

export type StudioBreakpoint =
  | "desktop"
  | "laptop"
  | "tablet"
  | "android"
  | "iphone"
  | "ultrawide";

export type StudioOrientation = "landscape" | "portrait";

export type StudioViewportPreset = {
  id: StudioBreakpoint;
  label: string;
  width: number;
  height: number;
};

export const STUDIO_VIEWPORT_PRESETS: StudioViewportPreset[] = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "laptop", label: "Laptop", width: 1280, height: 800 },
  { id: "tablet", label: "Tablet", width: 834, height: 1112 },
  { id: "android", label: "Android", width: 412, height: 915 },
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "ultrawide", label: "UltraWide", width: 1920, height: 1080 },
];

export type StudioPixelStyle = {
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
  margin?: number;
  gap?: number;
  border?: number;
  borderRadius?: number;
  shadow?: number;
  opacity?: number;
  blur?: number;
  rotation?: number;
  zIndex?: number;
  alignment?: "start" | "center" | "end";
  animation?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  imageSize?: number;
  iconSize?: number;
  columns?: number;
  rows?: number;
  display?: "grid" | "flex";
};

export type CanvasNode = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  hidden: boolean;
  groupId?: string;
  layer: number;
  style: StudioPixelStyle;
  visibility: Record<StudioBreakpoint, boolean>;
  linkedSectionId?: string;
  published?: boolean;
  archived?: boolean;
};

export type VisualCanvasDocument = {
  nodes: CanvasNode[];
  zoom: number;
  panX: number;
  panY: number;
  snapGrid: number;
  showGrid: boolean;
  showGuides: boolean;
  safeArea: boolean;
  selectedIds: string[];
};

export type StudioComponentDefinition = {
  id: string;
  label: string;
  category: "layout" | "commerce" | "navigation" | "content" | "widgets" | "system";
  icon: string;
  module?: string;
  defaultWidth: number;
  defaultHeight: number;
};

export type StudioTemplateDefinition = {
  id: string;
  label: string;
  pageType: string;
  icon: string;
  description: string;
};

export type StudioAssetItem = {
  id: string;
  name: string;
  format: "png" | "jpg" | "webp" | "avif" | "svg" | "lottie" | "video";
  src: string;
  folder: string;
  tags: string[];
  favorite: boolean;
};

export type StudioThemeLibraryEntry = {
  id: string;
  name: string;
  status: "live" | "draft" | "archived";
  version: number;
  updatedAt: string;
};

export type StudioVisualHistoryEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  component: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type StudioMarketplaceItem = {
  id: string;
  name: string;
  componentType: string;
  shared: boolean;
  archived: boolean;
  createdAt: string;
};

export type DesignTokensPro = PlatformThemeTokens & {
  typography?: {
    fontFamily?: string;
    headingScale?: number;
    bodyScale?: number;
  };
  spacing?: { unit?: number; sectionGap?: number };
  animations?: { duration?: number; easing?: string };
  transitions?: { fast?: number; medium?: number };
  breakpoints?: Partial<Record<StudioBreakpoint, number>>;
  colorMode?: "light" | "dark" | "system" | "seasonal";
  seasonalTheme?: string;
  buttons?: { radius?: number; padding?: number };
  icons?: { size?: number };
  cards?: { radius?: number; shadow?: number };
  containers?: { maxWidth?: number };
};

export type ThemeStudioProDocument = {
  version: number;
  updatedAt: string;
  canvas: VisualCanvasDocument;
  designTokens: DesignTokensPro;
  themeLibrary: StudioThemeLibraryEntry[];
  componentMarketplace: StudioMarketplaceItem[];
  visualHistory: StudioVisualHistoryEntry[];
  activeBreakpoint: StudioBreakpoint;
  orientation: StudioOrientation;
};

export type StudioModuleRegistration = {
  id: string;
  label: string;
  icon: string;
  category: string;
  componentTypes: string[];
};
