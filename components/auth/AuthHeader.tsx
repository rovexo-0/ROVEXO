import { cn } from "@/lib/cn";
import { AuthBrand } from "@/features/auth/components/AuthBrand";

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
      {showBrand ? <AuthBrand /> : null}
      <div className="flex max-w-[22rem] flex-col gap-ds-2">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-text-primary">{title}</h1>
        {description ? (
          <p className="text-[15px] leading-relaxed text-text-secondary">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
