"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DependencyList, ReactNode } from "react";
import { Alert, Badge, Button, Card, Descriptions, Empty, Input, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { ArrowRightOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { AdminRecord } from "@/lib/admin-utils";
import { displayAdminValue, formatAdminDate, formatAdminPrice } from "@/lib/admin-utils";
import { StatusChip } from "@/components/admin/status-chip";

export function useAdminResource<T>(load: () => Promise<T>, dependencies: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    load()
      .then((result) => { if (active) setData(result); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load admin data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, dependencies);

  return { data, error, loading };
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="adm-head adm-antd-head">
      <div><Typography.Title level={1}>{title}</Typography.Title>{description && <Typography.Text type="secondary">{description}</Typography.Text>}</div>
      {action}
    </header>
  );
}

export function AdminFeedback({ error, notice }: { error?: string; notice?: string }) {
  return (
    <>
      {error && <Alert role="alert" showIcon type="error" title={error} className="adm-antd-alert" />}
      {notice && <Alert role="status" showIcon type="success" title={notice} className="adm-antd-alert" />}
    </>
  );
}

export function AdminList({
  title,
  singular,
  rows,
  loading,
  error,
  createHref,
  detailHref,
  summary,
  subtitle,
  image,
  controls,
}: {
  title: string;
  singular: string;
  rows: AdminRecord[] | null;
  loading: boolean;
  error: string;
  createHref?: string;
  detailHref: (row: AdminRecord) => string;
  summary: (row: AdminRecord) => string;
  subtitle?: (row: AdminRecord) => string;
  image?: (row: AdminRecord) => string;
  controls?: (row: AdminRecord) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const visibleRows = (rows ?? []).filter((row) => {
    const needle = query.trim().toLowerCase();
    return !needle || JSON.stringify(row).toLowerCase().includes(needle);
  });
  const columns: TableColumnsType<AdminRecord> = [
    {
      title: "Record",
      key: "record",
      render: (_, row) => {
        const rowImage = image?.(row);
        return (
          <Space size={12}>
            {rowImage && <img className="adm-table-image" src={rowImage} alt="" loading="lazy" />}
            <div className="adm-table-record">
              <Link href={detailHref(row)}><Typography.Text strong>{summary(row)}</Typography.Text></Link>
              {subtitle && <Typography.Text type="secondary">{subtitle(row)}</Typography.Text>}
            </div>
          </Space>
        );
      },
    },

    // {
    //   title: "location",
    //   key: "location",
    //   align: "right",
    //   responsive: ["sm"],
    //   render: (_, row) => {
    //     const location = row.location;
    //     return location ? <Typography.Text>{location}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text>;
    //   },
    // },
    {
      title: "Created",
      key: "createdAt",
      align: "right",
      responsive: ["md"],
      render: (_, row) => {
        const createdAt = formatAdminDate(row.createdAt);
        return createdAt ? <Typography.Text>{createdAt}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text>;
      },
    },

    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, row) => (
        <Space wrap>
          {controls?.(row)}
          <Link href={detailHref(row)}><Button type="text" icon={<ArrowRightOutlined />} aria-label={`View ${summary(row)}`} /></Link>
        </Space>
      ),
    },
  ];
  return (
    <>
      <AdminPageHeader
        title={title}
        description={loading ? "Loading…" : `${rows?.length ?? 0} ${rows?.length === 1 ? singular : `${singular}s`}`}
        action={createHref && <Link href={createHref}><Button type="primary" icon={<PlusOutlined />}>New {singular}</Button></Link>}
      />
      <AdminFeedback error={error} />
      <Card className="adm-antd-card" variant="borderless">
        <Input
          allowClear
          className="adm-table-search"
          prefix={<SearchOutlined />}
          placeholder={`Search ${title.toLowerCase()}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Table<AdminRecord>
          aria-label={`${title} list`}
          rowKey={(row) => String(row.slug || row.reference || row.id)}
          columns={columns}
          dataSource={visibleRows}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} ${total === 1 ? singular : `${singular}s`}` }}
          scroll={{ x: 620 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={query ? "No matching records" : `No ${title.toLowerCase()} yet`} /> }}
        />
      </Card>
    </>
  );
}

export function AdminRecordDetails({ row }: { row: AdminRecord }) {
  const items = Object.entries(row)
    .filter(([key]) => !["id", "artistId", "isActive"].includes(key))
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
      let shown: ReactNode = displayAdminValue(value);
      if (["price", "total"].includes(key)) shown = formatAdminPrice(value, row.currency);
      if (["createdAt", "updatedAt"].includes(key)) shown = formatAdminDate(value);
      if (["status", "paymentStatus", "fulfillmentStatus"].includes(key)) shown = <StatusChip value={String(value ?? "")} />;
      if (["paymentMethod", "paymentProvider"].includes(key)) shown = <Tag>{String(value ?? "").replaceAll("_", " ")}</Tag>;
      if (key === "paymentUrl" && typeof value === "string") {
        shown = <a href={value} target="_blank" rel="noreferrer">Open payment link <ArrowRightOutlined /></a>;
      }
      if (key === "shippingAddress" && value && typeof value === "object") {
        shown = Object.entries(value).map(([field, part]) => `${field}: ${String(part)}`).join(", ");
      }
      if ((key === "items" || key === "paymentAttempts") && Array.isArray(value)) {
        shown = <Space direction="vertical" className="adm-detail-list" size="small">
          {value.map((record, index) => <Card size="small" key={index}><pre>{JSON.stringify(record, null, 2)}</pre></Card>)}
        </Space>;
      }
      return {
        key,
        label,
        children: shown,
        span: ["description", "bio", "message", "shippingAddress", "items", "paymentAttempts"].includes(key)
          ? { xs: 1, sm: 2 }
          : 1,
      };
    });
  return (
    <Card className="adm-antd-card" variant="borderless">
      <Descriptions bordered column={{ xs: 1, sm: 2 }} items={items} />
    </Card>
  );
}

export function AdminRecordPage({
  title,
  backHref,
  row,
  loading,
  error,
  editHref,
}: {
  title: string;
  backHref: string;
  row: AdminRecord | null;
  loading: boolean;
  error: string;
  editHref?: string;
}) {
  return (
    <>
      <AdminPageHeader title={title} action={
        <Link href={backHref}><Button>Back to list</Button></Link>
      } />
      <AdminFeedback error={error} />
      {loading ? <Card loading aria-label={`Loading ${title}`} /> : row ? (
        <>
          {editHref && <p><Link href={editHref}><Button type="primary">Edit</Button></Link></p>}
          <AdminRecordDetails row={row} />
        </>
      ) : !error ? <Empty description="Record not found" /> : null}
    </>
  );
}
