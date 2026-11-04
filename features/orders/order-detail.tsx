"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Descriptions, Empty, Listy, Select, Space, Typography } from "antd";
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
  const fulfillmentStatus = String(order?.fulfillmentStatus || order?.status || "");
  const statusOptions = [
    ...(!STATUSES.includes(fulfillmentStatus as (typeof STATUSES)[number])
      ? [{ value: fulfillmentStatus, label: fulfillmentStatus || "Choose status", disabled: true }]
      : []),
    ...STATUSES.map((status) => ({ value: status, label: status })),
  ];
  return <>
    <AdminPageHeader title={String(order?.reference || "Order details")} description={order?.createdAt ? `Created ${formatAdminDate(order.createdAt)}` : undefined}
      action={<Link className="adm-link" href="/admin/orders">Back to orders</Link>} />
    <AdminFeedback error={error || actionError} />
    {loading ? <div className="adm-skel adm-skel-row" aria-busy="true" /> : order ? (
      <div className="adm-order-detail">
        <Card title="Order status" className="adm-antd-card">
          <Space wrap>
            <StatusChip value={String(order.status || "")} />
            <StatusChip value={String(order.paymentStatus || "")} />
            <Typography.Text type="secondary">Fulfillment</Typography.Text>
            <Select value={fulfillmentStatus} disabled={busy}
              onChange={(status) => void updateStatus(status)}
              options={statusOptions} />
          </Space>
        </Card>
        <Card title="Customer" className="adm-antd-card">
          <Descriptions column={{ xs: 1, sm: 2 }} items={[
            { key: "name", label: "Name", children: String(order.customerName || "—") },
            { key: "email", label: "Email", children: String(order.customerEmail || order.email || "—") },
            { key: "phone", label: "Phone", children: String(order.customerPhone || "—") },
          ]} />
        </Card>
        <Card title="Shipping address" className="adm-antd-card">
          <Typography.Paragraph>{shipping ? ["address", "city", "postcode", "country"].map((key) => shipping[key]).filter(Boolean).join(", ") : "No shipping address provided."}</Typography.Paragraph>
        </Card>
        <Card title="Payment" className="adm-antd-card">
          <Descriptions column={1} items={[
            { key: "method", label: "Method", children: [order.paymentMethod, order.paymentProvider].filter(Boolean).join(" · ") || "—" },
            { key: "phone", label: "Payment phone", children: String(order.paymentPhone || "—") },
            { key: "total", label: "Total", children: formatAdminPrice(order.total, order.currency) },
          ]} />
        </Card>
        <Card title={`Items (${items.length})`} className="adm-antd-card">
          {items.length ? <Listy items={items} virtual={false} rowKey={(raw) => String((raw as Record<string, unknown>).id || (raw as Record<string, unknown>).productSlug)} itemRender={(raw, index) => {
            const item = raw as Record<string, unknown>;
            return <div className="adm-listy-row">
              <div>
                <Typography.Text strong>{String(item.title || item.productSlug || `Artwork ${index + 1}`)}</Typography.Text>
                <br />
                <Typography.Text type="secondary">{String(item.artistName || "")}</Typography.Text>
              </div>
              <Typography.Text>{formatAdminPrice(item.unitPrice, order.currency)} × {String(item.quantity || 0)}</Typography.Text>
            </div>;
          }} /> : <Empty description="No items provided by API." />}
          <Typography.Title level={5} className="adm-order-total">Total: {formatAdminPrice(order.total, order.currency)}</Typography.Title>
        </Card>
        <Card title={`Payment attempts (${attempts.length})`} className="adm-antd-card">
          {attempts.length ? <Listy items={attempts} virtual={false} rowKey={(raw) => String((raw as Record<string, unknown>).id || (raw as Record<string, unknown>).reference)} itemRender={(raw, index) => {
            const attempt = raw as Record<string, unknown>;
            return <div className="adm-listy-row">
              <div>
                <Typography.Text strong>{String(attempt.reference || `Payment attempt ${index + 1}`)}</Typography.Text>
                {attempt.createdAt != null && <><br /><Typography.Text type="secondary">{formatAdminDate(attempt.createdAt)}</Typography.Text></>}
              </div>
              <Space wrap>
                <StatusChip value={String(attempt.status || "")} />
                {typeof attempt.transactionId === "string" && <Typography.Text>Transaction: {attempt.transactionId}</Typography.Text>}
              </Space>
            </div>;
          }} /> : <Empty description="No payment attempts provided by API." />}
        </Card>
      </div>
    ) : !error ? <p role="status">Order not found.</p> : null}
  </>;
}
