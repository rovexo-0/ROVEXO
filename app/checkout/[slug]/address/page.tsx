import { CheckoutSlugPage } from "@/features/checkout/components/CheckoutSlugPage";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function CheckoutAddressRoute(props: Props) {
  return <CheckoutSlugPage {...props} initialStep="delivery" />;
}
