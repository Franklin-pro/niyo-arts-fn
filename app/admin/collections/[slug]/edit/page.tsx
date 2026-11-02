import { CollectionForm } from "@/features/collections/collection-form";

export default async function EditCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionForm slug={slug} />;
}
