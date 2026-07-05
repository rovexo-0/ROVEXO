"use client";

type StatusHeaderProps = {
  platformStatus: "healthy" | "degraded" | "unhealthy";
  generatedAt: string;
  liveLabel?: string;
};

const STATUS_LABEL = {
  healthy: "Live / Healthy",
  degraded: "Warning",
  unhealthy: "Critical",
} as const;

const STATUS_CLASS = {
  healthy: "cc1-status--healthy",
  degraded: "cc1-status--warning",
  unhealthy: "cc1-status--critical",
} as const;

export function StatusHeader({ platformStatus, generatedAt, liveLabel = "Operations Center" }: StatusHeaderProps) {
  return (
    <header className="cc1-header">
      <div className="cc1-header__copy">
        <p className="cc1-header__eyebrow">ROVEXO Super Admin</p>
        <h1 className="cc1-header__title">{liveLabel}</h1>
        <p className="cc1-header__subtitle">
          Enterprise live monitoring · Updated {new Date(generatedAt).toLocaleTimeString()}
        </p>
      </div>
      <div className={`cc1-status ${STATUS_CLASS[platformStatus]}`} role="status">
        <span className="cc1-status__dot" aria-hidden />
        {STATUS_LABEL[platformStatus]}
      </div>
    </header>
  );
}
