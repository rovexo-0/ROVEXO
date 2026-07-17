import { permanentRedirect } from "next/navigation";

/** Splash removed — canonical guest entry is Login. */
export default function SplashPageRemoved() {
  permanentRedirect("/login");
}
