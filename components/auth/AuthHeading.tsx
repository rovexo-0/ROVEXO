import { cn } from "@/lib/cn";

type AuthHeadingProps = {
  title: string;
  description?: string;
  className?: string;
};

export function AuthHeading({ title, description, className }: AuthHeadingProps) {
  return (
    <div className={cn("auth-heading", className)}>
      <h1 className="auth-heading__title">{title}</h1>
      {description ? <p className="auth-heading__description">{description}</p> : null}
    </div>
  );
}
