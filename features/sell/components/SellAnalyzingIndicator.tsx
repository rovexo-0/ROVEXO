import { cn } from "@/lib/cn";

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function SellAnalyzingIndicator() {
  return (
    <div
      className="flex items-center gap-ds-2 text-sm text-text-secondary"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner className="h-4 w-4 shrink-0 text-primary" />
      <span>✨ Analysing photos...</span>
    </div>
  );
}
