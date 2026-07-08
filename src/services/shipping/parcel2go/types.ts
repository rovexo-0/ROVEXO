/** Parcel2Go API wire types — internal to the provider layer only. */

export type Parcel2GoApiAddress = {
  ContactName?: string;
  Organisation?: string;
  Email?: string;
  Phone?: string;
  Property?: string;
  Street?: string;
  Street2?: string;
  Locality?: string;
  Town?: string;
  County?: string;
  Postcode?: string;
  Country?: string;
  CountryIsoCode?: string;
  CountryId?: number;
  SpecialInstructions?: string;
};

export type Parcel2GoApiParcel = {
  Id?: string;
  Value?: number;
  EstimatedValue?: number;
  Weight?: number;
  Length?: number;
  Width?: number;
  Height?: number;
  ContentsSummary?: string;
  DeliveryAddress?: Parcel2GoApiAddress;
};

export type Parcel2GoApiService = {
  Slug?: string;
  Name?: string;
  CourierName?: string;
  CourierSlug?: string;
  CollectionType?: string;
  DeliveryType?: string;
};

export type Parcel2GoApiQuote = {
  TotalPrice?: number;
  TotalPriceExVat?: number;
  TotalVat?: number;
  CurrencyCode?: string;
  EstimatedDeliveryDate?: string;
  Collection?: string;
  CutOff?: string;
  Service?: Parcel2GoApiService;
};

export type Parcel2GoApiQuoteResponse = {
  Quotes?: Parcel2GoApiQuote[];
};

export type Parcel2GoApiQuoteRequest = {
  CollectionAddress: Parcel2GoApiAddress;
  DeliveryAddress: Parcel2GoApiAddress;
  Parcels: Array<{
    Value?: number;
    Weight?: number;
    Length?: number;
    Width?: number;
    Height?: number;
  }>;
};

export type Parcel2GoApiOrderItem = {
  Id: string;
  CollectionDate: string;
  Service: string;
  Reference?: string;
  Parcels: Parcel2GoApiParcel[];
  CollectionAddress: Parcel2GoApiAddress;
  Upsells?: Array<{ Type: string }>;
};

export type Parcel2GoApiCreateOrderRequest = {
  Items: Parcel2GoApiOrderItem[];
  CustomerDetails: {
    Email: string;
    Forename: string;
    Surname: string;
  };
};

export type Parcel2GoApiOrderLineMap = {
  OrderLineIdHmac?: string;
  OrderLineId?: string;
  ItemId?: string;
};

export type Parcel2GoApiCreateOrderResponse = {
  OrderId?: string;
  TotalPrice?: number;
  TotalVat?: number;
  TotalPriceExVat?: number;
  Links?: {
    payment?: string;
    PayWithPrePay?: string;
  };
  OrderlineIdMap?: Parcel2GoApiOrderLineMap[];
};

export type Parcel2GoApiPayOrderResponse = {
  OrderId?: string;
  TrackingNumber?: string;
  LabelUrl?: string;
  Label?: string;
  Status?: string;
  Links?: Record<string, string>;
};

export type Parcel2GoApiLabelResponse = {
  Url?: string;
  LabelUrl?: string;
  Data?: string;
  Format?: string;
  TrackingNumber?: string;
};

export type Parcel2GoApiTrackingEvent = {
  EventId?: string;
  Status?: string;
  Description?: string;
  Location?: string;
  Date?: string;
};

export type Parcel2GoApiTrackingResponse = {
  OrderId?: string;
  OrderLineId?: string;
  TrackingNumber?: string;
  CourierName?: string;
  Status?: string;
  EstimatedDeliveryDate?: string;
  Events?: Parcel2GoApiTrackingEvent[];
  LastUpdated?: string;
};

export const PARCEL2GO_API_PATHS = {
  quotes: "/api/quotes",
  orders: "/api/orders",
  payWithPrepay: (orderId: string) => `/api/orders/${encodeURIComponent(orderId)}/paywithprepay`,
  label: (orderLineIdHmac: string) =>
    `/api/labels/${encodeURIComponent(orderLineIdHmac)}`,
  tracking: (reference: string) => `/api/tracking/${encodeURIComponent(reference)}`,
} as const;
