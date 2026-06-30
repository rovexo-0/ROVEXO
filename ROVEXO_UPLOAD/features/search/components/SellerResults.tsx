import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { SearchSeller, SearchUser } from "@/features/search/types";

type SellerResultsProps = {
  sellers: SearchSeller[];
  users: SearchUser[];
  activeIndex: number;
  navOffset: number;
  onHoverIndex: (index: number) => void;
  onNavigate?: () => void;
};

export function SellerResults({
  sellers,
  users,
  activeIndex,
  navOffset,
  onHoverIndex,
  onNavigate,
}: SellerResultsProps) {
  if (sellers.length === 0 && users.length === 0) return null;

  return (
    <ul className="flex flex-col gap-ds-1" role="listbox" aria-label="Sellers">
      {sellers.map((seller, sellerIndex) => {
        const navIndex = navOffset + sellerIndex;
        const isActive = activeIndex === navIndex;

        return (
          <li key={seller.href}>
            <Link
              href={seller.href}
              role="option"
              aria-selected={isActive}
              onClick={onNavigate}
              onMouseEnter={() => onHoverIndex(navIndex)}
              className={cn(
                "flex min-h-ds-7 items-center gap-ds-3 rounded-ds-md px-ds-3 hover:bg-secondary",
                focusRing,
                transitionFast,
                isActive && "bg-secondary",
              )}
            >
              <Avatar name={seller.name} alt={seller.name} src={seller.avatar} size="sm" />
              <span className="text-sm font-medium text-text-primary">{seller.name}</span>
            </Link>
          </li>
        );
      })}

      {users.map((user, userIndex) => {
        const navIndex = navOffset + sellers.length + userIndex;
        const isActive = activeIndex === navIndex;

        return (
          <li key={user.id}>
            <Link
              href={user.href}
              role="option"
              aria-selected={isActive}
              onMouseEnter={() => onHoverIndex(navIndex)}
              className={cn(
                "flex min-h-ds-7 items-center gap-ds-3 rounded-ds-md px-ds-3 hover:bg-secondary",
                focusRing,
                transitionFast,
                isActive && "bg-secondary",
              )}
            >
              <Avatar name={user.name} alt={user.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-text-primary">{user.name}</p>
                <p className="text-xs text-text-secondary">{user.handle}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
