import { buildStoreQrImageUrl, type StoreShareData } from "@/lib/store-sharing/store-share-v1";

export function StoreQRCode({ data }: { data: StoreShareData }) {
  return (
    <figure className="store-share-qr" data-store-share-qr="v1">
      {/* External QR endpoint is not on the Next image allowlist — plain img is required. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={buildStoreQrImageUrl(data.username, 220)}
        width={220}
        height={220}
        alt={`QR code for ${data.displayName}'s ROVEXO store`}
      />
    </figure>
  );
}
