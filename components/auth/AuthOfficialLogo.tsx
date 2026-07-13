import { RovexoAppIconMark } from "@/components/brand/RovexoAppIconMark";
import { RovexoWordmark } from "@/components/brand/RovexoWordmark";
import { AuthColoredTagline } from "@/components/auth/AuthColoredTagline";
import { cn } from "@/lib/cn";

type AuthOfficialLogoProps = {
  className?: string;
};

/** Full official ROVEXO logo block for login/register — mark + wordmark + coloured tagline. */
export function AuthOfficialLogo({ className }: AuthOfficialLogoProps) {
  return (
    <div className={cn("auth-official-logo", className)}>
      <div className="auth-official-logo__brand">
        <RovexoAppIconMark className="auth-official-logo__mark" contained uid="auth-official" />
        <RovexoWordmark className="auth-official-logo__wordmark" />
      </div>
      <AuthColoredTagline />
    </div>
  );
}
