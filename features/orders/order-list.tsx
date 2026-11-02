"use client";

import { useState } from "react";
import { AdminFeedback, AdminList, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminRecord } from "@/lib/admin-utils";

const STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

export function OrderList() {
  const [refresh, setRefresh] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busyReference, setBusyReference] = useState("");
  const { data, error, loading } = useAdminResource(
    () => adminApi.orders.list().then(({ data }) => toAdminRows(data)),
    [refresh],
  );
  const updateStatus = async (row: AdminRecord, status: string) => {
    const reference = String(row.reference || "");
    if (!reference || !STATUSES.includes(status as (typeof STATUSES)[number])) return;
    setBusyReference(reference); setActionError("");
    try {
      await adminApi.orders.updateStatus(reference, status as (typeof STATUSES)[number]);
      setRefresh((current) => current + 1);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to update order status.");
    } finally { setBusyReference(""); }
  };
  return <>
    <AdminFeedback error={actionError} />
    <AdminList
      title="Orders" singular="order" rows={data} error={error} loading={loading}
      detailHref={(row) => `/admin/orders/${encodeURIComponent(String(row.reference || ""))}`}
      summary={(row) => String(row.reference || "Order")}
      subtitle={(row) => [row.customerName, row.paymentStatus ? `Payment ${row.paymentStatus}` : "", row.total !== undefined ? `${row.currency || ""} ${row.total}` : ""].filter(Boolean).join(" · ")}
      controls={(row) => {
        const status = String(row.fulfillmentStatus || row.status || "");
        return <>
          <StatusChip value={status} />
          <select aria-label={`Update status for order ${String(row.reference || "")}`} value={status} disabled={busyReference === String(row.reference || "")}
            onChange={(event) => void updateStatus(row, event.target.value)}>
            {!STATUSES.includes(status as (typeof STATUSES)[number]) && <option value={status} disabled>{status || "Update status"}</option>}
            {STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </>;
      }}
    />
  </>;
}
