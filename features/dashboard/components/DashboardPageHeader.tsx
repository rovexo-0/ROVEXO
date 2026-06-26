import { cn } from "@/lib/cn";

type DashboardPageHeaderProps = {
  title: string;
  className?: string;
};

export function DashboardPageHeader({ title, className }: DashboardPageHeaderProps) {
  return (
    <header className={cn("dash-v1-header", className)}>
      <div className="dash-v1-header__row">
        <h1 className="dash-v1-header__title">{title}</h1>
      </div>
    </header>
  );
}
