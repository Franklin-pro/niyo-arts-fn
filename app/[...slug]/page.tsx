import SiteApp from '@/components/site-app'

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  return <SiteApp path={`/${slug.join('/')}`} />
}
