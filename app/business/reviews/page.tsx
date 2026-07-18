import { redirect } from "next/navigation";

/** Business Reviews — seller review centre with Business return path. */
export default function BusinessReviewsRedirect() {
  redirect("/seller/review-center?returnTo=/business/dashboard");
}
