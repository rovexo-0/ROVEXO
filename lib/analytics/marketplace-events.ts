import { trackGaEvent, type Ga4EventName, type Ga4EventParams } from "@/lib/analytics/ga4-events";
import { buildStoreUrl } from "@/lib/store-sharing/store-share-v1";

type ListingEventParams = {
  itemId: string;
  itemName?: string;
  price?: number;
  currency?: string;
  category?: string;
  sellerId?: string;
};

function listingParams(params: ListingEventParams): Ga4EventParams {
  return {
    item_id: params.itemId,
    item_name: params.itemName,
    price: params.price,
    currency: params.currency,
    item_category: params.category,
    seller_id: params.sellerId,
  };
}

export function trackMarketplaceSearch(searchTerm: string, resultsCount?: number): void {
  trackGaEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

export function trackViewListing(params: ListingEventParams): void {
  trackGaEvent("view_listing", listingParams(params));
  trackGaEvent("view_item", listingParams(params));
}

export function trackSaveListing(params: ListingEventParams): void {
  trackGaEvent("save_listing", listingParams(params));
  trackGaEvent("watchlist_add", listingParams(params));
}

export function trackShareListing(params: ListingEventParams & { method?: string }): void {
  trackGaEvent("share_listing", {
    ...listingParams(params),
    method: params.method ?? "native",
  });
}

export function trackStoreShare(
  event:
    | "store_store_visit"
    | "store_share_opened"
    | "store_share_copy_link"
    | "store_share_native"
    | "store_share_qr"
    | "store_share_instagram"
    | "store_share_whatsapp"
    | "store_share_facebook"
    | "store_share_messenger"
    | "store_share_telegram",
  params: { username: string; method?: string },
): void {
  const name: Ga4EventName = event;
  trackGaEvent(name, {
    username: params.username,
    method: params.method ?? "native",
    store_url: buildStoreUrl(params.username),
  });
}

export function trackContactSeller(params: ListingEventParams & { channel?: string }): void {
  trackGaEvent("contact_seller", {
    ...listingParams(params),
    channel: params.channel ?? "message",
  });
}

export function trackStartCheckout(params: ListingEventParams & { value?: number }): void {
  trackGaEvent("start_checkout", {
    ...listingParams(params),
    value: params.value ?? params.price,
  });
  trackGaEvent("begin_checkout", {
    ...listingParams(params),
    value: params.value ?? params.price,
  });
}

export function trackPurchase(params: ListingEventParams & { transactionId: string; value: number }): void {
  trackGaEvent("purchase", {
    ...listingParams(params),
    transaction_id: params.transactionId,
    value: params.value,
  });
}

export function trackCreateListing(params: { itemId: string; itemName?: string; category?: string }): void {
  trackGaEvent("create_listing", {
    item_id: params.itemId,
    item_name: params.itemName,
    item_category: params.category,
  });
  trackGaEvent("listing_created", {
    item_id: params.itemId,
    item_name: params.itemName,
    item_category: params.category,
  });
}

export function trackEditListing(params: { itemId: string; itemName?: string }): void {
  trackGaEvent("edit_listing", {
    item_id: params.itemId,
    item_name: params.itemName,
  });
}

export function trackDeleteListing(params: { itemId: string; itemName?: string }): void {
  trackGaEvent("delete_listing", {
    item_id: params.itemId,
    item_name: params.itemName,
  });
}

export function trackMarketplaceLogin(method = "email"): void {
  trackGaEvent("login", { method });
}

export function trackMarketplaceRegister(method = "email", role?: string): void {
  trackGaEvent("register", { method, role });
  trackGaEvent("sign_up", { method });
}

export function trackAuctionView(params: ListingEventParams): void {
  trackGaEvent("auction_view", listingParams(params));
}

export function trackAuctionBid(params: ListingEventParams & { bidAmount: number }): void {
  trackGaEvent("auction_bid", {
    ...listingParams(params),
    bid_amount: params.bidAmount,
  });
}

export function trackWatchlistAdd(params: ListingEventParams): void {
  trackGaEvent("watchlist_add", listingParams(params));
}

export function trackTrustProfileView(params: { userId: string; username?: string }): void {
  trackGaEvent("trust_profile_view", {
    user_id: params.userId,
    username: params.username,
  });
}
