"use client";

import { AdminList, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function ArtistList() {
  const [refresh, setRefresh] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busySlug, setBusySlug] = useState("");
  const { data, error, loading } = useAdminResource(
    () => adminApi.artists.list().then(({ data }) => toAdminRows(data)),
    [refresh],
  );
  const remove = async (slug: string) => {
    if (!window.confirm(`Delete or deactivate artist "${slug}"?`)) return;
    setBusySlug(slug); setActionError("");
    try { await adminApi.artists.remove(slug); setRefresh((current) => current + 1); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to delete artist."); }
    finally { setBusySlug(""); }
  };
  return <AdminList
    title="Artists" singular="artist" rows={data} error={error || actionError} loading={loading}
    createHref="/admin/artists/new"
    detailHref={(row) => `/admin/artists/${encodeURIComponent(String(row.slug || ""))}`}
    summary={(row) => String(row.name || row.slug || "Artist")}
    subtitle={(row) => [row.medium, row.location].filter(Boolean).join(" · ")}
    image={(row) => String(row.imageUrl || "")}
    controls={(row) => <button type="button" className="adm-icon-btn danger" disabled={busySlug === String(row.slug || "")}
      aria-label={`Delete ${String(row.name || row.slug || "artist")}`} onClick={() => void remove(String(row.slug || ""))}><Trash2 /></button>}
  />;
}
