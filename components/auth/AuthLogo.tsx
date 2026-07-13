import { RovexoAppIconMark } from "@/components/brand/RovexoAppIconMark";
import { RovexoWordmark } from "@/components/brand/RovexoWordmark";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { cn } from "@/lib/cn";

type AuthLogoProps = {
  className?: string;
};

/** Canonical auth logo block — matches approved splash mark + wordmark + tagline. */
export function AuthLogo({ className }: AuthLogoProps) {
  const { tagline } = AUTH_MASTER_SPEC.welcome.copy;

  return (
    <div className={cn("auth-logo", className)}>
      <RovexoAppIconMark className="auth-logo__mark" contained uid="welcome" />
      <RovexoWordmark className="auth-logo__wordmark" />
      <p className="auth-logo__tagline">{tagline}</p>
    </div>
  );
}
