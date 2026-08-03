import { redirect } from "next/navigation";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";

/** Alias route for the import wizard. */
export default function ImportWizardAliasRoute() {
  redirect(IMPORT_WIZARD_PATH);
}
