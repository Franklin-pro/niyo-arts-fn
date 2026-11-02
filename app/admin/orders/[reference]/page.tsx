import { OrderDetail } from "@/features/orders/order-detail";

export default async function OrderDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <OrderDetail reference={reference} />;
}
