import { cn } from "@/lib/cn";
import { shadowSoft } from "@/components/ui/tokens";

type AuthFieldGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthFieldGroup({ children, className }: AuthFieldGroupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-ds-xl border border-border/80 bg-surface shadow-ds-soft backdrop-blur-xl",
        shadowSoft,
        className,
      )}
    >
      {children}
    </div>
  );
}
