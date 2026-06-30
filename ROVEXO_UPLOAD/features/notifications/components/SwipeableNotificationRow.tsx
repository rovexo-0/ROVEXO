"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { transitionFast } from "@/components/ui/tokens";
import { CheckIcon, TrashIcon } from "@/features/notifications/icons";

type SwipeableNotificationRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onMarkRead: () => void;
  onOpen: () => void;
  read?: boolean;
};

const SWIPE_THRESHOLD = 72;
const MAX_SWIPE = 88;

export function SwipeableNotificationRow({
  children,
  onDelete,
  onMarkRead,
  onOpen,
  read = false,
}: SwipeableNotificationRowProps) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  const currentOffset = useRef(0);

  const resetPosition = () => {
    currentOffset.current = 0;
    setAnimating(true);
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 200);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    moved.current = false;
    startX.current = event.clientX - currentOffset.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    const next = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, event.clientX - startX.current));
    if (Math.abs(next) > 8) moved.current = true;
    currentOffset.current = next;
    setOffset(next);
  };

  const finishSwipe = () => {
    if (!dragging.current) return;
    dragging.current = false;

    if (currentOffset.current <= -SWIPE_THRESHOLD) {
      onDelete();
      resetPosition();
      return;
    }

    if (currentOffset.current >= SWIPE_THRESHOLD && !read) {
      onMarkRead();
      resetPosition();
      return;
    }

    if (!moved.current) {
      dragging.current = false;
      onOpen();
      return;
    }

    resetPosition();
  };

  return (
    <div className="relative overflow-hidden rounded-ds-lg">
      <div className="absolute inset-y-0 left-0 flex w-[88px] items-center justify-center gap-ds-1 bg-primary text-primary-foreground">
        <CheckIcon className="h-4 w-4" />
        <span className="text-xs font-semibold">Read</span>
      </div>

      <div className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center gap-ds-1 bg-danger text-danger-foreground">
        <TrashIcon className="h-4 w-4" />
        <span className="text-xs font-semibold">Delete</span>
      </div>

      <div
        className={cn("relative touch-pan-y", animating && transitionFast)}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
      >
        {children}
      </div>
    </div>
  );
}
