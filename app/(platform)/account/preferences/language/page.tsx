import { permanentRedirect } from "next/navigation";

/** Language preferences REMOVED — English (UK) only. */
export default function AccountLanguageRoute() {
  permanentRedirect("/account/settings");
}
