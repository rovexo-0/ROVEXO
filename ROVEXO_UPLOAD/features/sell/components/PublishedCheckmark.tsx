import { cn } from "@/lib/cn";

export function PublishedCheckmark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sell-published-check flex h-20 w-20 items-center justify-center rounded-ds-full bg-success/10",
        className,
      )}
    >
      <svg
        className="h-10 w-10 text-success"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <path
          className="sell-published-check-path"
          d="M8 12.5 10.5 15 16 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
