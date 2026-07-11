import { cn } from "@/lib/cn";
import { RX_SCROLL_PAGE, RX_SCROLL_PAGE_NO_NAV } from "@/lib/mobile-ui/scroll-standard";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        RX_SCROLL_PAGE,
        RX_SCROLL_PAGE_NO_NAV,
        "relative flex min-h-[100dvh] flex-col bg-white px-ds-5",
        "pb-[max(env(safe-area-inset-bottom),var(--ds-space-10))]",
        "pt-[max(env(safe-area-inset-top),var(--ds-space-10))]",
        className,
      )}
    >
      <main
        role="main"
        className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-ds-8"
      >
        {children}
      </main>
    </div>
  );
}
