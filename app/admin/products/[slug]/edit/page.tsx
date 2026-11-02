import { ProductForm } from "@/features/products/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductForm slug={slug} />;
}
