"use client";

import { AdminRecordPage, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

export function ArtistDetail({ slug }: { slug: string }) {
  const { data, error, loading } = useAdminResource(
    () => adminApi.artists.list().then(({ data }) => toAdminRows(data).find((row) => row.slug === slug) ?? null),
    [slug],
  );
  return <AdminRecordPage title={String(data?.name || "Artist details")} backHref="/admin/artists" row={data} loading={loading} error={error} editHref={`/admin/artists/${encodeURIComponent(slug)}/edit`} />;
}
