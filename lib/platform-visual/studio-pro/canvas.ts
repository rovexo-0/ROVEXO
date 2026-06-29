import type { HomepageBuilderComponent, HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";
import type {
  CanvasNode,
  StudioComponentDefinition,
  StudioPixelStyle,
  StudioVisualHistoryEntry,
  VisualCanvasDocument,
} from "@/lib/platform-visual/studio-pro/types";

export function snapValue(value: number, grid: number): number {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}

export function createCanvasNodeFromComponent(
  definition: StudioComponentDefinition,
  position: { x: number; y: number },
  layer: number,
): CanvasNode {
  return {
    id: `node-${definition.id}-${Math.random().toString(36).slice(2, 10)}`,
    type: definition.id,
    label: definition.label,
    x: position.x,
    y: position.y,
    width: definition.defaultWidth,
    height: definition.defaultHeight,
    rotation: 0,
    locked: false,
    hidden: false,
    layer,
    style: {},
    visibility: {
      desktop: true,
      laptop: true,
      tablet: true,
      android: true,
      iphone: true,
      ultrawide: true,
    },
    published: false,
    archived: false,
  };
}

export function duplicateCanvasNode(node: CanvasNode, layer: number): CanvasNode {
  return {
    ...node,
    id: `node-${node.type}-${Math.random().toString(36).slice(2, 10)}`,
    x: node.x + 24,
    y: node.y + 24,
    locked: false,
    layer,
  };
}

export function groupCanvasNodes(nodes: CanvasNode[], ids: string[], groupId: string): CanvasNode[] {
  const idSet = new Set(ids);
  return nodes.map((node) => (idSet.has(node.id) ? { ...node, groupId } : node));
}

export function ungroupCanvasNodes(nodes: CanvasNode[], groupId: string): CanvasNode[] {
  return nodes.map((node) =>
    node.groupId === groupId ? { ...node, groupId: undefined } : node,
  );
}

export function reorderLayers(nodes: CanvasNode[], id: string, direction: "up" | "down"): CanvasNode[] {
  const sorted = [...nodes].sort((a, b) => a.layer - b.layer);
  const index = sorted.findIndex((node) => node.id === id);
  if (index < 0) return nodes;
  const swapIndex = direction === "up" ? index + 1 : index - 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return nodes;
  const currentLayer = sorted[index].layer;
  sorted[index] = { ...sorted[index], layer: sorted[swapIndex].layer };
  sorted[swapIndex] = { ...sorted[swapIndex], layer: currentLayer };
  return sorted;
}

export function applyNodeStylePatch(node: CanvasNode, patch: Partial<StudioPixelStyle>): CanvasNode {
  const style = { ...node.style, ...patch };
  return {
    ...node,
    style,
    width: patch.width ?? node.width,
    height: patch.height ?? node.height,
    rotation: patch.rotation ?? node.rotation,
  };
}

export function syncHomepageFromCanvas(
  homepage: HomepageBuilderConfig,
  nodes: CanvasNode[],
): HomepageBuilderConfig {
  const bySection = new Map(
    nodes
      .filter((node) => node.linkedSectionId)
      .map((node) => [node.linkedSectionId!, node] as const),
  );

  const components: HomepageBuilderComponent[] = homepage.components.map((component) => {
    const node = bySection.get(component.id);
    if (!node) return component;

    return {
      ...component,
      label: node.label,
      enabled: !node.hidden,
      published: node.published ?? component.published,
      order: node.layer,
      visibility: {
        desktop: node.visibility.desktop,
        tablet: node.visibility.tablet,
        mobile: node.visibility.android || node.visibility.iphone,
      },
      style: {
        ...component.style,
        width: node.style.width ?? node.width,
        height: node.style.height ?? node.height,
        padding: node.style.padding,
        margin: node.style.margin,
        gap: node.style.gap,
        borderRadius: node.style.borderRadius,
        shadow: node.style.shadow,
        opacity: node.style.opacity,
        rotation: node.rotation,
        fontSize: node.style.fontSize,
        iconSize: node.style.iconSize,
        columns: node.style.columns,
        rows: node.style.rows,
      },
    };
  });

  return {
    ...homepage,
    components,
    updatedAt: new Date().toISOString(),
  };
}

export function createVisualHistoryEntry(input: {
  administrator: string;
  component: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): StudioVisualHistoryEntry {
  return {
    id: `vh-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    component: input.component,
    action: input.action,
    oldValue: input.oldValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
  };
}

export function appendVisualHistory(
  history: StudioVisualHistoryEntry[],
  entry: StudioVisualHistoryEntry,
  limit = 100,
): StudioVisualHistoryEntry[] {
  return [entry, ...history].slice(0, limit);
}

export function updateCanvasSelection(canvas: VisualCanvasDocument, selectedIds: string[]): VisualCanvasDocument {
  return { ...canvas, selectedIds };
}

export function deleteCanvasNodes(canvas: VisualCanvasDocument, ids: string[]): VisualCanvasDocument {
  const idSet = new Set(ids);
  return {
    ...canvas,
    nodes: canvas.nodes.filter((node) => !idSet.has(node.id)),
    selectedIds: canvas.selectedIds.filter((id) => !idSet.has(id)),
  };
}
