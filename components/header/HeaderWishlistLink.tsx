import { HeaderIconLink } from "@/components/header/HeaderIconLink";
import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";

type HeaderWishlistLinkProps = {
  className?: string;
  size?: "default" | "compact";
};

export function HeaderWishlistLink({ className, size = "default" }: HeaderWishlistLinkProps) {
  const iconSize = size === "compact" ? 18 : 20;

  return (
    <HeaderIconLink href="/saved" label="Saved items" size={size} className={className}>
      <Fluency3DIcon icon="saved" size={iconSize} />
    </HeaderIconLink>
  );
}
