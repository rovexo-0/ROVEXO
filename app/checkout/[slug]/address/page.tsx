import { CheckoutSlugPage } from "@/features/checkout/components/CheckoutSlugPage";

type Props = { params: Promise<{ slug: string }> };

export default function CheckoutAddressRoute(props: Props) {
  return <CheckoutSlugPage {...props} initialStep="delivery" />;
}
