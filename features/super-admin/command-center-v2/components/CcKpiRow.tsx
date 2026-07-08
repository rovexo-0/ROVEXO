import {
  Activity,
  MessageSquare,
  Package,
  Percent,
  PoundSterling,
  Users,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CommandCenterKpiCard } from "@/lib/super-admin/command-center-v1/types";
import { CcAnimatedCounter } from "@/features/super-admin/command-center-v2/components/CcAnimatedCounter";
import { CcSparkline } from "@/features/super-admin/command-center-v2/components/CcSparkline";

const KPI_ICONS: Record<string, typeof Users> = {
  "users-online": Users,
  "registered-users": UserRound,
  "active-listings": Package,
  "active-orders": Activity,
  "revenue-today": PoundSterling,
  "live-messages": MessageSquare,
  "conversion-rate": Percent,
};

const KPI_STROKE: Record<CommandCenterKpiCard["tone"], string> = {
  blue: "#60a5fa",
  purple: "#a78bfa",
  green: "#4ade80",
  orange: "#fb923c",
  indigo: "#818cf8",
  pink: "#f472b6",
  teal: "#2dd4bf",
};

type CcKpiRowProps = {
  cards: CommandCenterKpiCard[];
};

export function CcKpiRow({ cards }: CcKpiRowProps) {
  return (
    <div className="cc2-kpi-row">
      {cards.map((card) => {
        const Icon = KPI_ICONS[card.id] ?? Activity;
        return (
          <article key={card.id} className={cn("cc2-kpi-card", `cc2-kpi-card--${card.tone}`)}>
            <div className="cc2-kpi-card__top">
              <span className="cc2-kpi-card__icon" aria-hidden>
                <Icon size={18} />
              </span>
              <p className="cc2-kpi-card__label">{card.label}</p>
            </div>
            <p className="cc2-kpi-card__value">
              <CcAnimatedCounter value={card.value} format={card.format} />
            </p>
            <p className={cn("cc2-kpi-card__delta", card.delta >= 0 ? "is-up" : "is-down")}>
              {card.delta >= 0 ? "+" : ""}
              {card.delta}% {card.deltaLabel}
            </p>
            <CcSparkline
              points={card.sparkline}
              className="cc2-kpi-card__sparkline"
              stroke={KPI_STROKE[card.tone]}
              fill={`${KPI_STROKE[card.tone]}22`}
            />
          </article>
        );
      })}
    </div>
  );
}
