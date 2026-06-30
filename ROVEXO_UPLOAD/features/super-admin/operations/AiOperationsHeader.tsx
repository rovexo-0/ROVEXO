export function AiOperationsHeader() {
  return (
    <header className="ai-ops-hero rx-glass relative overflow-hidden rounded-ds-xl border border-primary/15 p-ds-6 sm:p-ds-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">ROVEXO Super Admin</p>
        <h1 className="mt-ds-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          AI Operations Center
        </h1>
        <p className="mt-ds-3 max-w-2xl text-sm text-text-secondary sm:text-base">
          Intelligent platform monitoring, diagnostics and automatic repair.
        </p>
      </div>
    </header>
  );
}
