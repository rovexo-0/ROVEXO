import { cn } from "@/lib/cn";

type DashboardPageHeaderProps = {
  title: string;
  className?: string;
};

export function DashboardPageHeader({ title, className }: DashboardPageHeaderProps) {
  return (
    <header className={cn("rx-dash-header", className)}>
      <div className="rx-dash-header__row">
        <h1 className="rx-dash-header__title">{title}</h1>
      </div>
    </header>
  );
}
