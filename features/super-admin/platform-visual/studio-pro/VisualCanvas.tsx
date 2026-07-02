"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/cn";
import { snapValue } from "@/lib/platform-visual/studio-pro/canvas";
import type { CanvasNode, VisualCanvasDocument } from "@/lib/platform-visual/studio-pro/types";

type VisualCanvasProps = {
  canvas: VisualCanvasDocument;
  onChange: (canvas: VisualCanvasDocument) => void;
};

export function VisualCanvas({ canvas, onChange }: VisualCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [panState, setPanState] = useState<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const updateNode = useCallback(
    (nodeId: string, patch: Partial<CanvasNode>) => {
      onChange({
        ...canvas,
        nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
      });
    },
    [canvas, onChange],
  );

  const selectNode = useCallback(
    (nodeId: string, additive: boolean) => {
      const selectedIds = additive
        ? canvas.selectedIds.includes(nodeId)
          ? canvas.selectedIds.filter((id) => id !== nodeId)
          : [...canvas.selectedIds, nodeId]
        : [nodeId];
      onChange({ ...canvas, selectedIds });
    },
    [canvas, onChange],
  );

  const handleNodePointerDown = (event: ReactPointerEvent, node: CanvasNode) => {
    if (node.locked) return;
    event.stopPropagation();
    selectNode(node.id, event.shiftKey);
    setDragState({
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (dragState) {
      const dx = (event.clientX - dragState.startX) / canvas.zoom;
      const dy = (event.clientY - dragState.startY) / canvas.zoom;
      updateNode(dragState.nodeId, {
        x: snapValue(dragState.originX + dx, canvas.snapGrid),
        y: snapValue(dragState.originY + dy, canvas.snapGrid),
      });
      return;
    }

    if (panState) {
      onChange({
        ...canvas,
        panX: panState.originX + (event.clientX - panState.startX),
        panY: panState.originY + (event.clientY - panState.startY),
      });
    }
  };

  const handlePointerUp = () => {
    setDragState(null);
    setPanState(null);
    setMarquee(null);
  };

  const handleViewportPointerDown = (event: ReactPointerEvent) => {
    if (event.target !== viewportRef.current && !(event.target as HTMLElement).classList.contains("tsp-canvas__surface")) {
      return;
    }
    if (event.button === 1 || event.altKey) {
      setPanState({
        startX: event.clientX,
        startY: event.clientY,
        originX: canvas.panX,
        originY: canvas.panY,
      });
      return;
    }
    if (!event.shiftKey) {
      onChange({ ...canvas, selectedIds: [] });
    }
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMarquee({ x: event.clientX - rect.left, y: event.clientY - rect.top, w: 0, h: 0 });
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const nextZoom = Math.min(2, Math.max(0.4, canvas.zoom - event.deltaY * 0.001));
    onChange({ ...canvas, zoom: nextZoom });
  };

  return (
    <div className="tsp-canvas" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      <div className="tsp-canvas__toolbar">
        <span>Zoom {(canvas.zoom * 100).toFixed(0)}%</span>
        <button type="button" className="tsp-canvas__tool" onClick={() => onChange({ ...canvas, zoom: Math.min(2, canvas.zoom + 0.1) })}>
          +
        </button>
        <button type="button" className="tsp-canvas__tool" onClick={() => onChange({ ...canvas, zoom: Math.max(0.4, canvas.zoom - 0.1) })}>
          −
        </button>
        <button type="button" className="tsp-canvas__tool" onClick={() => onChange({ ...canvas, panX: 0, panY: 0, zoom: 1 })}>
          Reset view
        </button>
        <label className="tsp-canvas__toggle">
          <input type="checkbox" checked={canvas.showGrid} onChange={(event) => onChange({ ...canvas, showGrid: event.target.checked })} />
          Snap grid
        </label>
        <label className="tsp-canvas__toggle">
          <input type="checkbox" checked={canvas.showGuides} onChange={(event) => onChange({ ...canvas, showGuides: event.target.checked })} />
          Guides
        </label>
        <label className="tsp-canvas__toggle">
          <input type="checkbox" checked={canvas.safeArea} onChange={(event) => onChange({ ...canvas, safeArea: event.target.checked })} />
          Safe area
        </label>
      </div>

      <div
        ref={viewportRef}
        className={cn("tsp-canvas__viewport", canvas.showGrid && "tsp-canvas__viewport--grid")}
        onPointerDown={handleViewportPointerDown}
        onWheel={handleWheel}
      >
        <div
          className="tsp-canvas__surface"
          style={{
            transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.zoom})`,
          }}
        >
          {canvas.safeArea ? <div className="tsp-canvas__safe-area" aria-hidden /> : null}
          {canvas.nodes
            .filter((node) => !node.hidden)
            .sort((a, b) => a.layer - b.layer)
            .map((node) => {
              const selected = canvas.selectedIds.includes(node.id);
              return (
                <div
                  key={node.id}
                  className={cn(
                    "tsp-canvas__node",
                    selected && "tsp-canvas__node--selected",
                    node.locked && "tsp-canvas__node--locked",
                  )}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                    transform: `rotate(${node.rotation}deg)`,
                    zIndex: node.layer,
                    opacity: node.style.opacity ?? 1,
                    borderRadius: node.style.borderRadius,
                    boxShadow: node.style.shadow ? `0 ${node.style.shadow * 4}px ${node.style.shadow * 12}px rgba(15,23,42,.12)` : undefined,
                  }}
                  onPointerDown={(event) => handleNodePointerDown(event, node)}
                >
                  <span className="tsp-canvas__node-icon" aria-hidden>
                    {node.label}
                  </span>
                  <span className="tsp-canvas__node-type">{node.type}</span>
                  {node.locked ? <span className="tsp-canvas__node-badge">Locked</span> : null}
                </div>
              );
            })}
        </div>
        {marquee ? (
          <div
            className="tsp-canvas__marquee"
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          />
        ) : null}
      </div>
    </div>
  );
}
