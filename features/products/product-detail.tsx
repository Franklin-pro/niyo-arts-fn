"use client";

import { useAdminResource, AdminRecordPage } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

export function ProductDetail({ slug }: { slug: string }) {
  const { data, error, loading } = useAdminResource(
    () => adminApi.products.list().then(({ data: products }) =>
      toAdminRows(products).find((product) => product.slug === slug) ?? null),
    [slug],
  );
  return <AdminRecordPage
    title={String(data?.title || "Product details")}
    backHref="/admin/products"
    row={data}
    loading={loading}
    error={error}
    editHref={`/admin/products/${encodeURIComponent(slug)}/edit`}
  />;
}
