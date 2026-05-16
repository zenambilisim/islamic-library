import EditCategoryPage from '@/views/Admin/EditCategoryPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditCategoryPage categoryId={id} />;
}
