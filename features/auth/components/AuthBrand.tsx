import { RovexoLogo } from "@/components/brand/RovexoLogo";
import { cn } from "@/lib/cn";

type AuthBrandProps = {
  className?: string;
};

export function AuthBrand({ className }: AuthBrandProps) {
  return (
    <div className={cn("flex flex-col items-center gap-ds-2 text-center", className)}>
      <RovexoLogo className="mx-auto" />
      <p className="text-sm font-medium tracking-wide text-text-secondary">Buy. Sell. Grow.</p>
    </div>
  );
}
