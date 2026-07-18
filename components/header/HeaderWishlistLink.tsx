import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { HeartLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";

type HeaderWishlistLinkProps = {
  className?: string;
  size?: "default" | "compact";
};

export function HeaderWishlistLink({ className, size = "default" }: HeaderWishlistLinkProps) {
  const iconClass = size === "compact" ? "h-[18px] w-[18px]" : "h-5 w-5";

  return (
    <HeaderIconLink href="/saved" label="Saved items" size={size} className={className}>
      <HeartLineIcon className={cn(iconClass)} />
    </HeaderIconLink>
  );
}
