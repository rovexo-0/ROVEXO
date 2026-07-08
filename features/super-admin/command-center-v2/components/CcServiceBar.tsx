import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CommandCenterServiceStatus } from "@/lib/super-admin/command-center-v1/types";

type CcServiceBarProps = {
  services: CommandCenterServiceStatus[];
};

export function CcServiceBar({ services }: CcServiceBarProps) {
  return (
    <div className="cc2-service-bar" role="list" aria-label="Service status">
      {services.map((service) => (
        <Link
          key={service.id}
          href={service.href}
          className={cn("cc2-service-bar__item", `cc2-service-bar__item--${service.state}`)}
          role="listitem"
          aria-label={`${service.label}: ${service.statusLabel}. Open diagnostics`}
          title={`Open ${service.label} diagnostics`}
        >
          <span className="cc2-service-bar__dot" aria-hidden />
          <div>
            <strong>{service.label}</strong>
            <span>{service.statusLabel}</span>
            <small>{service.detail}</small>
          </div>
        </Link>
      ))}
    </div>
  );
}
