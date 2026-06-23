import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { ChevronRightIcon } from "@/features/product-detail/icons";
import type { ConversationProduct } from "@/lib/messages/types";

type PinnedProductCardProps = {
  product: ConversationProduct;
};

export function PinnedProductCard({ product }: PinnedProductCardProps) {
  return (
    <Link href={`/listing/${product.slug}`} className="block">
      <Card padding="sm" interactive className="">
        <div className="flex items-center gap-ds-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold text-text-primary">{product.title}</p>
            <Price amount={product.price} size="sm" className="mt-ds-1" />
            <div className="mt-ds-1 flex flex-wrap gap-ds-1">
              <Badge variant="success">{product.condition}</Badge>
              {product.status === "sold" ? <Badge variant="default">Sold</Badge> : null}
            </div>
          </div>

          <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
        </div>
      </Card>
    </Link>
  );
}
