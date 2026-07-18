import { redirect } from "next/navigation";

export default function ProhibitedItemsRedirect() {
  redirect("/legal/prohibited-restricted-items");
}
