import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { cn } from "@/lib/cn";
type AuthHeaderProps = {
  title: string;
  description?: string;
  showBrand?: boolean;
  className?: string;
};

export function AuthHeader({
  title,
  description,
  showBrand = true,
  className,
}: AuthHeaderProps) {
  return (
    <header className={cn("auth-header flex flex-col items-center gap-ds-6 text-center", className)}>
      {showBrand ? <RovexoBrandLogo className="rovexo-brand-logo--auth" /> : null}
      <div className="flex w-full flex-col gap-ds-2">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-text-primary">{title}</h1>
        {description ? (
          <p className="text-[15px] leading-relaxed text-text-secondary">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
