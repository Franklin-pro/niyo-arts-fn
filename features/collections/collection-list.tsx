"use client";

import { AdminList, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function CollectionList() {
  const [refresh, setRefresh] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busySlug, setBusySlug] = useState("");
  const { data, error, loading } = useAdminResource(
    () => adminApi.collections.list().then(({ data }) => toAdminRows(data)),
    [refresh],
  );
  const remove = async (slug: string) => {
    if (!window.confirm(`Delete or deactivate collection "${slug}"?`)) return;
    setBusySlug(slug); setActionError("");
    try { await adminApi.collections.remove(slug); setRefresh((current) => current + 1); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to delete collection."); }
    finally { setBusySlug(""); }
  };
  return <AdminList
    title="Collections" singular="collection" rows={data} error={error || actionError} loading={loading}
    createHref="/admin/collections/new"
    detailHref={(row) => `/admin/collections/${encodeURIComponent(String(row.slug || ""))}`}
    summary={(row) => String(row.title || row.slug || "Collection")}
    subtitle={(row) => [row.line, Array.isArray(row.products) ? `${row.products.length} works` : ""].filter(Boolean).join(" · ")}
    image={(row) => String(row.imageUrl || "")}
    controls={(row) => <button type="button" className="adm-icon-btn danger" disabled={busySlug === String(row.slug || "")}
      aria-label={`Delete ${String(row.title || row.slug || "collection")}`} onClick={() => void remove(String(row.slug || ""))}><Trash2 /></button>}
  />;
}
