import { cn } from "@/lib/cn";
import { MotionDiv } from "@/components/ui/motion";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-ds-4",
        "pb-[max(env(safe-area-inset-bottom),var(--ds-space-8))]",
        "pt-[max(env(safe-area-inset-top),var(--ds-space-8))]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--ds-color-primary),transparent)] opacity-[0.18]"
      />
      <div
        aria-hidden
        className="premium-shimmer pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-muted/50 to-transparent"
      />
      <MotionDiv className="premium-card relative z-10 w-full max-w-[420px] p-ds-6 sm:p-ds-8">
        {children}
      </MotionDiv>
    </div>
  );
}
