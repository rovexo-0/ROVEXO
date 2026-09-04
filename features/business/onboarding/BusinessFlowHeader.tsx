import "@/styles/rovexo/business-onboarding-v1.css";

type BusinessFlowHeaderProps = {
  active: "information" | "stripe" | "review";
  informationDone?: boolean;
  stripeDone?: boolean;
};

function stepClass(
  current: "information" | "stripe" | "review",
  active: "information" | "stripe" | "review",
  done: boolean,
): string {
  if (active === current) return "biz-flow__step biz-flow__step--active";
  if (done) return "biz-flow__step biz-flow__step--done";
  return "biz-flow__step";
}

export function BusinessFlowHeader({
  active,
  informationDone = false,
  stripeDone = false,
}: BusinessFlowHeaderProps) {
  const infoDone = informationDone || active === "stripe" || active === "review";
  const stripeComplete = stripeDone || active === "review";

  return (
    <nav className="biz-flow__stepper" aria-label="Business onboarding steps">
      <span className={stepClass("information", active, infoDone)}>
        {infoDone && active !== "information" ? "✓ " : ""}1 Info
      </span>
      <span className={stepClass("stripe", active, stripeComplete)}>
        {stripeComplete ? "✓ " : ""}2 Stripe
      </span>
      <span className={stepClass("review", active, false)}>3 Review</span>
    </nav>
  );
}
