"use client";

import { useAdminResource, AdminList } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import { useState } from "react";
import { Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

export function ProductList() {
  const [refresh, setRefresh] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busySlug, setBusySlug] = useState("");
  const { data, error, loading } = useAdminResource(
    () => adminApi.products.list().then(({ data: products }) => toAdminRows(products)),
    [refresh],
  );
  const remove = async (slug: string) => {
    if (!window.confirm(`Delete or deactivate product "${slug}"?`)) return;
    setBusySlug(slug); setActionError("");
    try {
      await adminApi.products.remove(slug);
      setRefresh((current) => current + 1);
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to delete product."); }
    finally { setBusySlug(""); }
  };
  const rows = [...(data ?? [])].sort((a, b) => {
    const aDate = new Date(String(a.uploadedAt || a.createdAt || 0)).getTime();
    const bDate = new Date(String(b.uploadedAt || b.createdAt || 0)).getTime();
    return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate);
  });
  return (
    <AdminList
      title="Arts"
      singular="product"
      rows={rows}
      loading={loading}
      error={error || actionError}
      createHref="/admin/products/new"
      detailHref={(row) => `/admin/products/${encodeURIComponent(String(row.slug || ""))}`}
      summary={(row) => String(row.title || row.slug || "Untitled product")}
      subtitle={(row) => [row.category || row.type, row.price !== undefined ? `${row.currency || "USD"} ${row.price}` : ""].filter(Boolean).join(" · ")}
      image={(row) => String(row.imageUrl || "")}
      controls={(row) => <Popconfirm title="Delete or deactivate this product?" description={String(row.title || row.slug || "")}
        onConfirm={() => void remove(String(row.slug || ""))} okText="Continue" okButtonProps={{ danger: true }}>
        <Button type="text" danger icon={<DeleteOutlined />} loading={busySlug === String(row.slug || "")}
          aria-label={`Delete ${String(row.title || row.slug || "product")}`} />
      </Popconfirm>}
    />
  );
}
