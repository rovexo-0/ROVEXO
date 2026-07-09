import type {
  CommerceLineItem,
  CommerceOrderMeta,
  CommerceParcel,
  CommerceSellerGroup,
  CommerceSellerShipment,
  CommerceTotals,
} from "@/features/commerce-ui/types";

/** Mock product images — local SVG placeholders safe for SafeImage. */
const IMG_DUVET = "/placeholder-product.svg";
const IMG_PILLOW = "/placeholder-product.svg";

export const MOCK_LINE_ITEMS: CommerceLineItem[] = [
  {
    id: "item-duvet",
    title: "Luxury Duvet",
    quantity: 3,
    price: 375,
    imageUrl: IMG_DUVET,
  },
  {
    id: "item-pillow",
    title: "Premium Pillow",
    quantity: 5,
    price: 210,
    imageUrl: IMG_PILLOW,
  },
];

export const MOCK_SELLER_GROUP: CommerceSellerGroup = {
  sellerId: "seller-techgear",
  sellerName: "TechGear",
  items: MOCK_LINE_ITEMS,
};

export const MOCK_TOTALS: CommerceTotals = {
  products: 585,
  shipping: 11.69,
  platformFee: 32.17,
  total: 628.86,
};

export const MOCK_ORDER_META: CommerceOrderMeta = {
  orderNumber: "RVX-10482",
  placedAt: "2 May 2025 at 09:41",
  itemCount: 3,
  paymentStatus: "paid",
  invoiceHref: "/orders/rvx-10482/invoice",
};

export const MOCK_PARCELS: CommerceParcel[] = [
  {
    id: "parcel-1",
    index: 1,
    totalParcels: 2,
    status: "in_transit",
    carrier: "Evri",
    trackingNumber: "H00A1B2C3D4E5F6",
    estimatedDelivery: "6 May 2025",
    trackingUrl: "https://www.evri.com/track/parcel/H00A1B2C3D4E5F6",
    items: [MOCK_LINE_ITEMS[0]!],
    operation: null,
  },
  {
    id: "parcel-2",
    index: 2,
    totalParcels: 2,
    status: "preparing",
    carrier: "Evri",
    trackingNumber: "H00G7H8I9J0K1L2",
    estimatedDelivery: "7 May 2025",
    trackingUrl: null,
    items: [MOCK_LINE_ITEMS[1]!],
    operation: null,
  },
];

export const MOCK_SELLER_SHIPMENTS: CommerceSellerShipment[] = [
  {
    sellerId: "seller-techgear",
    sellerName: "TechGear",
    parcelCount: 2,
    shipmentReady: true,
    parcels: MOCK_PARCELS,
    trackingHref: "/ui-lock/commerce/tracking",
  },
];

export const MOCK_PARCEL_COUNT = 2;
