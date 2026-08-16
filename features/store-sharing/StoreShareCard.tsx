import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  STORE_SHARE_COPY,
  formatStoreShareFollowersLabel,
  formatStoreShareListingsLabel,
  formatStoreShareRatingLabel,
  type StoreShareData,
} from "@/lib/store-sharing/store-share-v1";

export function StoreShareCard({ data }: { data: StoreShareData }) {
  return (
    <article className="store-share-card" data-store-share-card="v1">
      <p className="store-share-card__brand">ROVEXO</p>
      <div className="store-share-card__identity">
        <Avatar
          src={data.avatarUrl}
          alt={data.displayName}
          name={data.displayName}
          size="lg"
        />
        <div className="store-share-card__names">
          <p className="store-share-card__name">
            <span>{data.displayName}</span>
            {data.verified ? (
              <VerifiedBadge className="store-share-card__verified" title="Verified Seller" size={16} />
            ) : null}
          </p>
          <p className="store-share-card__handle">@{data.username}</p>
          <p className="store-share-card__rating">{formatStoreShareRatingLabel(data)}</p>
        </div>
      </div>
      <p className="store-share-card__stats">
        {formatStoreShareFollowersLabel(data.followersCount)}
        {" · "}
        {formatStoreShareListingsLabel(data.activeListingsCount)}
      </p>
      <p className="store-share-card__promo">{STORE_SHARE_COPY.promoLine}</p>
      <p className="store-share-card__support">{STORE_SHARE_COPY.supporting}</p>
      <p className="store-share-card__url">{data.storeUrl}</p>
      <p className="store-share-card__cta">{STORE_SHARE_COPY.viewStore}</p>
    </article>
  );
}
