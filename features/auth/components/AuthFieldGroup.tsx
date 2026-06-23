import { cn } from "@/lib/cn";
import { premiumFormSection } from "@/components/ui/tokens";

type AuthFieldGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthFieldGroup({ children, className }: AuthFieldGroupProps) {
  return (
    <div className={cn(premiumFormSection, "overflow-hidden rounded-ds-xl", className)}>
      {children}
    </div>
  );
}
