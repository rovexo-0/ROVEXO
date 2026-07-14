import { CheckoutSlugPage } from "@/features/checkout/components/CheckoutSlugPage";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function CheckoutRoute(props: Props) {
  return <CheckoutSlugPage {...props} initialStep="review" />;
}
