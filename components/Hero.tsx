import Link from "next/link";

const trustBadges = [
  "Purchase protection",
  "Free shipping £50+",
  "Verified sellers",
  "Secure payments",
];

/** Absolute Final — solid purple hero, no gradient / premium motion. */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="relative flex min-h-[320px] w-full flex-col justify-center px-4 py-12 sm:min-h-[360px] sm:py-14">
        <p className="mb-3 inline-flex w-fit items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm font-medium text-white">
          BUY · SELL · GROW
        </p>
        <h1 className="w-full text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          Buy and sell on ROVEXO.
        </h1>
        <p className="mt-3 w-full text-base text-white/90 sm:text-lg">
          Fashion, tech, home, and more — with purchase protection and verified sellers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="rounded-ds-md bg-white px-6 py-3 text-sm font-bold text-primary"
          >
            Start shopping
          </Link>
          <Link
            href="/sell"
            className="rounded-ds-md border border-white px-6 py-3 text-sm font-bold text-white"
          >
            Sell
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
          {trustBadges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
