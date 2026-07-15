import Link from "next/link";
import { RovexoWordmark } from "@/components/brand/RovexoWordmark";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

/**
 * ROVEXO Welcome v2.0 — canonical release.
 * Authentication, session handling, and canonical route destinations remain unchanged.
 */
export function WelcomeScreen() {
  const { routes } = AUTH_MASTER_SPEC.welcome;

  return (
    <main
      className="welcome-v2"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="welcome-v2"
      data-auth-ui="v2.0-official-release"
      data-welcome-lock="CANONICAL-V2"
    >
      <div className="welcome-v2__content">
        <header className="welcome-v2__brand">
          <RovexoWordmark className="welcome-v2__wordmark" />
          <p className="welcome-v2__tagline" aria-hidden>
            BUY <span>•</span> SELL <span>•</span> GROW.
          </p>
        </header>

        <div
          className="welcome-v2__hero"
          role="img"
          aria-label="Premium marketplace collection"
        >
          <div className="welcome-v2__ambient" aria-hidden />
          <div className="welcome-v2__orb" aria-hidden />
          <div className="welcome-v2__ring" aria-hidden />
          <div className="welcome-v2__cube" aria-hidden />
          <div className="welcome-v2__cone" aria-hidden />
          <div className="welcome-v2__ground-shadow" aria-hidden />
        </div>

        <section className="welcome-v2__message" aria-labelledby="welcome-v2-title">
          <h1 id="welcome-v2-title">
            The open marketplace
            <br />
            for real value.
          </h1>
          <p>
            Buy, sell, and grow across curated assets
            <br />
            and opportunities.
          </p>
        </section>

        <nav className="welcome-v2__actions" aria-label="Welcome actions">
          <Link className="welcome-v2__continue" href={routes.register}>
            Continue
          </Link>
          <Link className="welcome-v2__sign-in" href={routes.signIn}>
            Sign In
          </Link>
        </nav>

        <footer className="welcome-v2__legal">
          <Link href={routes.privacy}>Privacy Policy</Link>
          <span aria-hidden>•</span>
          <Link href={routes.terms}>Terms of Service</Link>
          <span aria-hidden>•</span>
          <Link href="/legal/cookie-policy">Cookie Policy</Link>
        </footer>
      </div>
    </main>
  );
}
