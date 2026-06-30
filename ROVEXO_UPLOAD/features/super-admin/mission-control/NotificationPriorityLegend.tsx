import { NOTIFICATION_PRIORITY_LEGEND } from "@/lib/super-admin/mission-control/defaults";

export function NotificationPriorityLegend() {
  return (
    <div className="mc-priority-legend">
      {NOTIFICATION_PRIORITY_LEGEND.map((item) => (
        <div key={item.severity} className="mc-priority-legend__item">
          <span className={`mc-priority-legend__dot mc-priority-legend__dot--${item.color}`} aria-hidden />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
