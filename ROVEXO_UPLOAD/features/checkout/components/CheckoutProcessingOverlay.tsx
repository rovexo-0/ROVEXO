import { cn } from "@/lib/cn";

export function CheckoutProcessingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-overlay px-ds-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-ds-3 rounded-ds-lg bg-surface px-ds-6 py-ds-5 shadow-ds-floating">
        <svg className={cn("h-8 w-8 animate-spin text-primary")} viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        <p className="text-sm font-medium text-text-primary">Processing payment...</p>
      </div>
    </div>
  );
}
