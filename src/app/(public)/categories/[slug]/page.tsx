import CategoryBySlugPage from '@/views/CategoryBySlugPage';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryBySlugPage slug={slug} />;
}
