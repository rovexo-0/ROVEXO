import { Card, type CardProps } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type DashboardCardProps = CardProps;

export function DashboardCard({ className, ...props }: DashboardCardProps) {
  return <Card className={cn("rx-dash-card rx-dashboard-card", className)} {...props} />;
}
