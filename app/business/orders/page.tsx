import { redirect } from "next/navigation";

export default function BusinessOrdersRedirect() {
  redirect("/seller/orders");
}
