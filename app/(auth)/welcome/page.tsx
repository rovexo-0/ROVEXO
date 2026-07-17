import { permanentRedirect } from "next/navigation";

/** Welcome removed — canonical guest entry is Login. */
export default function WelcomePageRemoved() {
  permanentRedirect("/login");
}
