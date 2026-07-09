import { ValidationError } from "@/src/services/shipping/errors";
import type {
  CancelShipmentRequest,
  CreateOrderRequest,
  GetLabelsRequest,
  GetQuotesRequest,
  GetTrackingRequest,
  ParcelDimensions,
  PayOrderRequest,
  ShippingAddress,
} from "@/src/services/shipping/types";

const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
}

function validateAddress(address: ShippingAddress, label: string): void {
  assertNonEmpty(address.fullName, `${label}.fullName`);
  assertNonEmpty(address.line1, `${label}.line1`);
  assertNonEmpty(address.city, `${label}.city`);
  assertNonEmpty(address.postcode, `${label}.postcode`);
  assertNonEmpty(address.country, `${label}.country`);

  const country = address.country.trim().toLowerCase();
  if (["uk", "gb", "gbr", "united kingdom"].includes(country)) {
    if (!UK_POSTCODE_PATTERN.test(address.postcode.trim())) {
      throw new ValidationError(`${label}.postcode must be a valid UK postcode`);
    }
  }
}

function validateParcel(parcel: ParcelDimensions, index: number): void {
  const label = `parcels[${index}]`;

  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0) {
    throw new ValidationError(`${label}.weightKg must be greater than 0`);
  }
  if (!Number.isFinite(parcel.lengthCm) || parcel.lengthCm <= 0) {
    throw new ValidationError(`${label}.lengthCm must be greater than 0`);
  }
  if (!Number.isFinite(parcel.widthCm) || parcel.widthCm <= 0) {
    throw new ValidationError(`${label}.widthCm must be greater than 0`);
  }
  if (!Number.isFinite(parcel.heightCm) || parcel.heightCm <= 0) {
    throw new ValidationError(`${label}.heightCm must be greater than 0`);
  }
  if (parcel.valueGbp !== undefined && (!Number.isFinite(parcel.valueGbp) || parcel.valueGbp < 0)) {
    throw new ValidationError(`${label}.valueGbp must be zero or greater`);
  }
}

export function validateGetQuotesRequest(request: GetQuotesRequest): void {
  validateAddress(request.collectionAddress, "collectionAddress");
  validateAddress(request.deliveryAddress, "deliveryAddress");

  if (!request.parcels.length) {
    throw new ValidationError("At least one parcel is required");
  }

  request.parcels.forEach(validateParcel);
}

export function validateCreateOrderRequest(request: CreateOrderRequest): void {
  assertNonEmpty(request.quoteId, "quoteId");
  assertNonEmpty(request.rateId, "rateId");
  assertNonEmpty(request.reference, "reference");
  validateAddress(request.collectionAddress, "collectionAddress");
  validateAddress(request.deliveryAddress, "deliveryAddress");

  if (!request.collectionAddress.phone?.trim()) {
    throw new ValidationError("collectionAddress.phone is required for Parcel2Go orders");
  }

  if (!request.parcels.length) {
    throw new ValidationError("At least one parcel is required");
  }

  request.parcels.forEach(validateParcel);
}

export function validatePayOrderRequest(request: PayOrderRequest): void {
  assertNonEmpty(request.shipmentId, "shipmentId");
}

export function validateGetLabelsRequest(request: GetLabelsRequest): void {
  assertNonEmpty(request.shipmentId, "shipmentId");
}

export function validateGetTrackingRequest(request: GetTrackingRequest): void {
  assertNonEmpty(request.shipmentId, "shipmentId");
}

export function validateCancelShipmentRequest(request: CancelShipmentRequest): void {
  assertNonEmpty(request.shipmentId, "shipmentId");
}
