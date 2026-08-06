"use client";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Auto-dismiss ms. Default 3500. Payment Methods Error UX uses 2500 (2–3s). */
  durationMs?: number;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success/10 text-text-primary",
  error: "border-danger/30 bg-danger/10 text-text-primary",
  warning: "border-warning/30 bg-warning/10 text-text-primary",
  info: "border-primary/30 bg-primary/10 text-text-primary",
};

/**
 * Keeps `{children}` as a stable element reference across toast list updates
 * so the app tree does not re-render when a toast appears or dismisses.
 */
const ToastTree = memo(function ToastTree({ children }: { children: ReactNode }) {
  return <>{children}</>;
});

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+72px)] z-[300] flex flex-col items-center gap-ds-2 px-ds-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto rx-sheet w-full max-w-sm border px-ds-4 py-ds-3 rx-enter",
            variantStyles[toast.variant],
            transitionFast,
          )}
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-ds-1 text-sm text-text-secondary">{toast.description}</p>
          ) : null}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
            className={cn("mt-ds-2 text-xs font-semibold text-primary", focusRing)}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const durationMs = toast.durationMs ?? 3500;
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, durationMs);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastTree>{children}</ToastTree>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
