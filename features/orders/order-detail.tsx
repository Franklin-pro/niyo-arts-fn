"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows, formatAdminDate, formatAdminPrice } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

const STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

export function OrderDetail({ reference }: { reference: string }) {
  const [refresh, setRefresh] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: order, error, loading } = useAdminResource(
    () => adminApi.orders.list().then(({ data }) =>
      toAdminRows(data).find((item) => item.reference === reference) ?? null),
    [reference, refresh],
  );
  const updateStatus = async (status: string) => {
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;
    setBusy(true); setActionError("");
    try {
      await adminApi.orders.updateStatus(reference, status as (typeof STATUSES)[number]);
      setRefresh((current) => current + 1);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to update order status.");
    } finally { setBusy(false); }
  };
  const shipping = order?.shippingAddress && typeof order.shippingAddress === "object"
    ? order.shippingAddress as Record<string, unknown> : null;
  const items = Array.isArray(order?.items) ? order.items : [];
  const attempts = Array.isArray(order?.paymentAttempts) ? order.paymentAttempts : [];
  return <>
    <AdminPageHeader title={String(order?.reference || "Order details")} description={order?.createdAt ? `Created ${formatAdminDate(order.createdAt)}` : undefined}
      action={<Link className="adm-link" href="/admin/orders">Back to orders</Link>} />
    <AdminFeedback error={error || actionError} />
    {loading ? <div className="adm-skel adm-skel-row" aria-busy="true" /> : order ? (
      <div className="adm-order-detail">
        <section className="adm-panel">
          <h2>Order status</h2>
          <div className="adm-row-controls"><StatusChip value={String(order.status || "")} /><StatusChip value={String(order.paymentStatus || "")} />
            <label>Fulfillment status <select value={String(order.fulfillmentStatus || order.status || "")} disabled={busy}
              onChange={(event) => void updateStatus(event.target.value)}>
              {!STATUSES.includes(String(order.fulfillmentStatus || order.status || "") as (typeof STATUSES)[number]) && <option value={String(order.fulfillmentStatus || order.status || "")}>{String(order.fulfillmentStatus || order.status || "Choose status")}</option>}
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select></label>
          </div>
        </section>
        <section className="adm-panel">
          <h2>Customer</h2>
          <dl className="adm-order-summary">
            <div><dt>Name</dt><dd>{String(order.customerName || "—")}</dd></div>
            <div><dt>Email</dt><dd>{String(order.customerEmail || order.email || "—")}</dd></div>
            <div><dt>Phone</dt><dd>{String(order.customerPhone || "—")}</dd></div>
            <div><dt>Customer user ID</dt><dd>{String(order.userId || "Not provided by API")}</dd></div>
          </dl>
        </section>
        <section className="adm-panel">
          <h2>Shipping address</h2>
          <p>{shipping ? ["address", "city", "postcode", "country"].map((key) => shipping[key]).filter(Boolean).join(", ") : "No shipping address provided."}</p>
        </section>
        <section className="adm-panel">
          <h2>Payment</h2>
          <p>{[order.paymentMethod, order.paymentProvider].filter(Boolean).join(" · ") || "—"}</p>
          <p>Payment phone: {String(order.paymentPhone || "—")}</p>
          <p>Total: {formatAdminPrice(order.total, order.currency)}</p>
          {typeof order.paymentUrl === "string" && <a href={order.paymentUrl} target="_blank" rel="noreferrer">Open payment link</a>}
        </section>
        <section className="adm-panel">
          <h2>Items ({items.length})</h2>
          {items.length ? <ul className="adm-order-list">{items.map((raw, index) => {
            const item = raw as Record<string, unknown>;
            return <li key={String(item.id || item.productSlug || index)}>
              <strong>{String(item.title || item.productSlug || "Artwork")}</strong>
              <span>{String(item.artistName || "")}</span>
              <span>{formatAdminPrice(item.unitPrice, order.currency)} × {String(item.quantity || 0)}</span>
            </li>;
          })}</ul> : <p>No items provided by API.</p>}
          <p className="adm-order-total">Total: {formatAdminPrice(order.total, order.currency)}</p>
        </section>
        <section className="adm-panel">
          <h2>Payment attempts ({attempts.length})</h2>
          {attempts.length ? <ul className="adm-order-list">{attempts.map((raw, index) => {
            const attempt = raw as Record<string, unknown>;
            return <li key={String(attempt.id || attempt.reference || index)}>
              <strong>{String(attempt.reference || "Payment attempt")}</strong>
              <StatusChip value={String(attempt.status || "")} />
              <span>{attempt.createdAt ? formatAdminDate(attempt.createdAt) : ""}</span>
              {attempt.transactionId && <span>Transaction: {String(attempt.transactionId)}</span>}
              {typeof attempt.paymentUrl === "string" && <a href={attempt.paymentUrl} target="_blank" rel="noreferrer">Open payment link</a>}
            </li>;
          })}</ul> : <p>No payment attempts provided by API.</p>}
        </section>
      </div>
    ) : !error ? <p role="status">Order not found.</p> : null}
  </>;
}
