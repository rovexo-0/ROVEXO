import type { MissionControlService } from "@/lib/super-admin/mission-control/types";
import { cn } from "@/lib/cn";

type MissionControlServiceGridProps = {
  services: MissionControlService[];
};

const STATUS_LABEL = {
  online: "ONLINE",
  warning: "WARNING",
  offline: "OFFLINE",
} as const;

export function MissionControlServiceGrid({ services }: MissionControlServiceGridProps) {
  return (
    <div className="mc-service-grid">
      {services.map((service) => (
        <div key={service.id} className={cn("mc-service-card", `mc-service-card--${service.status}`)}>
          <span className={cn("mc-service-card__dot", `mc-service-card__dot--${service.status}`)} aria-hidden />
          <div className="min-w-0">
            <p className="mc-service-card__label">{service.label}</p>
            <p className="mc-service-card__status">{STATUS_LABEL[service.status]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
