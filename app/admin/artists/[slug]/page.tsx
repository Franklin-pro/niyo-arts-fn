import { ArtistDetail } from "@/features/artists/artist-detail";

export default async function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtistDetail slug={slug} />;
}
