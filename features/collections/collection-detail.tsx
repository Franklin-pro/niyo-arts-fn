"use client";

import { AdminRecordPage, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

export function CollectionDetail({ slug }: { slug: string }) {
  const { data, error, loading } = useAdminResource(
    () => adminApi.collections.list().then(({ data }) => toAdminRows(data).find((row) => row.slug === slug) ?? null),
    [slug],
  );
  return <AdminRecordPage title={String(data?.title || "Collection details")} backHref="/admin/collections" row={data} loading={loading} error={error} editHref={`/admin/collections/${encodeURIComponent(slug)}/edit`} />;
}
