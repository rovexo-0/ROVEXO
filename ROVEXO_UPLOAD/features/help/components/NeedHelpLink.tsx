import Link from "next/link";
import { suggestArticlesForPath } from "@/lib/help/search";

type NeedHelpLinkProps = {
  pathname: string;
  className?: string;
};

export function NeedHelpLink({ pathname, className }: NeedHelpLinkProps) {
  const suggestions = suggestArticlesForPath(pathname);
  const primary = suggestions[0];

  if (!primary) {
    return (
      <Link href="/help" className={className ?? "text-sm font-medium text-primary underline"}>
        Need Help?
      </Link>
    );
  }

  return (
    <Link
      href={`/help/${primary.slug}`}
      className={className ?? "text-sm font-medium text-primary underline"}
    >
      Need Help?
    </Link>
  );
}
