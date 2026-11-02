import { ArtistForm } from "@/features/artists/artist-form";

export default async function EditArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtistForm slug={slug} />;
}
