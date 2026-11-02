"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties, DependencyList, ReactNode } from "react";
import { AlertCircle, ArrowUpRight, Search } from "lucide-react";
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
    <header className="adm-head">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </header>
  );
}

export function AdminFeedback({ error, notice }: { error?: string; notice?: string }) {
  return (
    <>
      {error && <p role="alert" className="adm-alert"><AlertCircle /> {error}</p>}
      {notice && <p role="status" className="adm-notice">{notice}</p>}
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
  const visibleRows = (rows ?? []).filter((row) =>
    !query.trim() || JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <AdminPageHeader
        title={title}
        description={loading ? "Loading…" : `${rows?.length ?? 0} ${rows?.length === 1 ? singular : `${singular}s`}`}
        action={createHref && <Link className="button-link" href={createHref}>New {singular} <ArrowUpRight /></Link>}
      />
      <AdminFeedback error={error} />
      <div className="adm-toolbar">
        <label className="adm-search">
          <Search />
          <input type="search" placeholder={`Search ${title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {loading ? (
        <div className="adm-list" aria-busy="true">{[0, 1, 2, 3, 4].map((index) => <div className="adm-skel adm-skel-row" key={index} />)}</div>
      ) : visibleRows.length ? (
        <div className="adm-list">
          {visibleRows.map((row, index) => {
            const key = String(row.slug || row.reference || row.id || index);
            const rowImage = image?.(row);
            return (
              <article className="adm-row" key={key} style={{ "--i": Math.min(index, 12) } as CSSProperties}>
                <div className="adm-thumb">{rowImage ? <img src={rowImage} alt="" loading="lazy" /> : <span>{title.slice(0, 1)}</span>}</div>
                <div className="adm-row-main">
                  <h3><Link href={detailHref(row)}>{summary(row)}</Link></h3>
                  {subtitle && <p>{subtitle(row)}</p>}
                  <Link className="adm-link" href={detailHref(row)}>View details <ArrowUpRight /></Link>
                </div>
                {controls && <div className="adm-row-controls">{controls(row)}</div>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="adm-empty">
          <h2>{query ? "No matches" : `No ${title.toLowerCase()} yet`}</h2>
          <p>{query ? "Try a different search term." : `New ${title.toLowerCase()} will appear here.`}</p>
        </div>
      )}
    </>
  );
}

export function AdminRecordDetails({ row }: { row: AdminRecord }) {
  return (
    <div className="adm-details">
      <dl>
        {Object.entries(row)
          .filter(([key]) => !["id", "artistId", "isActive"].includes(key))
          .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
            let shown: ReactNode = displayAdminValue(value);
            if (["price", "total"].includes(key)) shown = formatAdminPrice(value, row.currency);
            if (["createdAt", "updatedAt"].includes(key)) shown = formatAdminDate(value);
            if (["status", "paymentStatus", "fulfillmentStatus"].includes(key)) shown = <StatusChip value={String(value ?? "")} />;
            if (key === "paymentUrl" && typeof value === "string") {
              shown = <a href={value} target="_blank" rel="noreferrer">Open payment link <ArrowUpRight /></a>;
            }
            if (key === "shippingAddress" && value && typeof value === "object") {
              shown = Object.values(value).filter((part) => typeof part === "string" && part).join(", ");
            }
            if ((key === "items" || key === "paymentAttempts") && Array.isArray(value)) {
              shown = <ul className="adm-order-list">{value.map((item, index) => (
                <li key={index}><pre>{JSON.stringify(item, null, 2)}</pre></li>
              ))}</ul>;
            }
            return <div key={key} data-wide={["description", "bio", "message", "shippingAddress", "items", "paymentAttempts"].includes(key)}><dt>{label}</dt><dd>{shown}</dd></div>;
          })}
      </dl>
    </div>
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
        <Link className="button-link" href={backHref}>Back to list</Link>
      } />
      <AdminFeedback error={error} />
      {loading ? <div className="adm-skel adm-skel-row" aria-busy="true" /> : row ? (
        <>
          {editHref && <p><Link className="button-link" href={editHref}>Edit</Link></p>}
          <AdminRecordDetails row={row} />
        </>
      ) : !error ? <p role="status">Record not found.</p> : null}
    </>
  );
}
