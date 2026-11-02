import { CollectionDetail } from "@/features/collections/collection-detail";

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionDetail slug={slug} />;
}
