import Link from "next/link";

const trustBadges = [
  "Buyer protection",
  "Free shipping €50+",
  "Verified sellers",
  "Secure payments",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]" />
      <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[480px] sm:px-6 sm:py-20 lg:min-h-[520px] lg:px-8">
        <p className="mb-4 inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm ring-1 ring-white/20">
          The modern marketplace for buying and selling
        </p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
          The marketplace where pre-loved meets premium.
        </h1>
        <p className="mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
          Buy and sell fashion, tech, home, and more — with buyer protection,
          verified sellers, and zero listing fees.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-[#2563eb] shadow-lg transition-transform hover:scale-105 sm:text-base"
          >
            Start shopping
          </Link>
          <Link
            href="/sell"
            className="rounded-2xl border-2 border-white/50 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:text-base"
          >
            Sell for free
          </Link>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-blue-100">
          {trustBadges.map((badge) => (
            <li key={badge} className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs text-white">
                ✓
              </span>
              {badge}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
