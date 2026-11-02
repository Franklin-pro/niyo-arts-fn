"use client";

import Link from "next/link";
import { useAuth } from "@/components/site-provider";
import type { CSSProperties } from "react";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows, type AdminRecord } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import { ArrowUpRight, Layers, Mail, Package, Palette, ShoppingBag } from "lucide-react";

const sections = [
  { key: "products", label: "Arts", href: "/admin/products", icon: Package, hint: "Works for sale" },
  { key: "artists", label: "Artists", href: "/admin/artists", icon: Palette, hint: "Artist profiles" },
  { key: "collections", label: "Collections", href: "/admin/collections", icon: Layers, hint: "Curated groups" },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingBag, hint: "Customer orders" },
  { key: "contacts", label: "Messages", href: "/admin/contacts", icon: Mail, hint: "Contact inbox" },
] as const;

type OverviewData = Record<(typeof sections)[number]["key"], AdminRecord[]>;

export function DashboardOverview() {
  const { user } = useAuth();
  const { data, error, loading } = useAdminResource(async (): Promise<OverviewData> => {
    const [products, artists, collections, orders, contacts] = await Promise.all([
      adminApi.products.list(), adminApi.artists.list(), adminApi.collections.list(),
      adminApi.orders.list(), adminApi.contacts.list(),
    ]);
    return {
      products: toAdminRows(products.data), artists: toAdminRows(artists.data),
      collections: toAdminRows(collections.data), orders: toAdminRows(orders.data),
      contacts: toAdminRows(contacts.data),
    };
  }, []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name.split(" ")[0] || "there";
  const openOrders = data?.orders.filter((order) => !["delivered", "cancelled"].includes(String(order.fulfillmentStatus || order.status).toLowerCase())).length ?? 0;
  const newMessages = data?.contacts.filter((contact) => String(contact.status || "new") === "new").length ?? 0;

  return <>
    <AdminPageHeader title={`${greeting}, ${firstName}`} description="Here’s what’s happening in the gallery today." />
    <AdminFeedback error={error} />
    <div className="adm-stats" aria-busy={loading}>
      {sections.map(({ key, label, href, icon: Icon, hint }, index) => {
        const count = data?.[key].length ?? 0;
        const subtitle = key === "orders" ? `${openOrders} open` : key === "contacts" ? `${newMessages} new` : hint;
        return <Link className="adm-stat" href={href} key={key} style={{ "--i": Math.min(index, 12) } as CSSProperties}>
          <span className="adm-stat-icon"><Icon /></span><strong>{loading ? "—" : count}</strong>
          <span className="adm-stat-label">{label}</span><small>{subtitle}</small><ArrowUpRight className="adm-stat-arrow" />
        </Link>;
      })}
    </div>
    <div className="adm-panels">
      {(["orders", "contacts"] as const).map((key) => {
        const label = key === "orders" ? "Latest orders" : "Latest messages";
        const href = `/admin/${key}`;
        const latest = (data?.[key] ?? []).slice(0, 5);
        return <section className="adm-panel" key={key}>
          <header><h2>{label}</h2><Link href={href} className="adm-link">View all <ArrowUpRight /></Link></header>
          {loading ? <p role="status">Loading…</p> : latest.length ? <ul>
            {latest.map((record, index) => {
              const recordHref = key === "orders"
                ? `/admin/orders/${encodeURIComponent(String(record.reference || ""))}`
                : `/admin/contacts/${encodeURIComponent(String(record.id || ""))}`;
              return <li key={String(record.reference || record.id || index)}>
                <div><strong><Link href={recordHref}>{String(record.reference || record.name || record.email || "Record")}</Link></strong>
                  <small>{key === "orders" ? [record.customerName, record.paymentStatus].filter(Boolean).join(" · ") : [record.email, record.subject].filter(Boolean).join(" · ")}</small></div>
                <StatusChip value={String(key === "orders" ? record.fulfillmentStatus || record.status || "" : record.status || "new")} />
              </li>;
            })}
          </ul> : <p className="adm-empty-inline">No {key} yet.</p>}
        </section>;
      })}
    </div>
  </>;
}
