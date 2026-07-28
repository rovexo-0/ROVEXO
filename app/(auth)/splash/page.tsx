import { permanentRedirect } from "next/navigation";

/**
 * Splash removed — Cod Sânge v3.0.
 * Guest entry remains Login only.
 */
export default function SplashPage() {
  permanentRedirect("/login");
}
