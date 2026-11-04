"use client";

import Link from "next/link";
import { useAuth } from "@/components/site-provider";
import { Alert, Card, Col, Empty, Listy, Row, Skeleton, Statistic, Typography } from "antd";
import { AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows, type AdminRecord } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import { AppstoreOutlined, ArrowRightOutlined, MailOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons";

const sections = [
  { key: "products", label: "Arts", href: "/admin/products", icon: <AppstoreOutlined />, hint: "Works for sale" },
  { key: "artists", label: "Artists", href: "/admin/artists", icon: <UserOutlined />, hint: "Artist profiles" },
  { key: "collections", label: "Collections", href: "/admin/collections", icon: <AppstoreOutlined />, hint: "Curated groups" },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: <ShoppingOutlined />, hint: "Customer orders" },
  { key: "contacts", label: "Messages", href: "/admin/contacts", icon: <MailOutlined />, hint: "Contact inbox" },
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
    {error && <Alert showIcon type="error" title={error} />}
    <Row gutter={[16, 16]} className="adm-stat-grid" aria-busy={loading}>
      {sections.map(({ key, label, href, icon, hint }) => {
        const count = data?.[key].length ?? 0;
        const subtitle = key === "orders" ? `${openOrders} open` : key === "contacts" ? `${newMessages} new` : hint;
        return <Col xs={12} md={8} xl={key === "orders" || key === "contacts" ? 4 : 4} key={key}>
          <Link className="adm-stat-link" href={href}>
            <Card hoverable className="adm-antd-stat">
              <Statistic title={label} value={loading ? 0 : count} prefix={icon} suffix={<Typography.Text type="secondary">{subtitle}</Typography.Text>} />
            </Card>
          </Link>
        </Col>;
      })}
    </Row>
    <Row gutter={[16, 16]} className="adm-dashboard-panels">
      {(["orders", "contacts"] as const).map((key) => {
        const label = key === "orders" ? "Latest orders" : "Latest messages";
        const href = `/admin/${key}`;
        const latest = (data?.[key] ?? []).slice(0, 5);
        return <Col xs={24} xl={12} key={key}>
          <Card title={label} extra={<Link href={href}>View all <ArrowRightOutlined /></Link>} className="adm-antd-card">
            {loading ? <Skeleton active /> : latest.length ? <Listy
              items={latest}
              virtual={false}
              rowKey={(record) => String(record.reference || record.id)}
              itemRender={(record) => {
                const recordHref = key === "orders"
                  ? `/admin/orders/${encodeURIComponent(String(record.reference || ""))}`
                  : `/admin/contacts/${encodeURIComponent(String(record.id || ""))}`;
                return <div className="adm-listy-row">
                  <div>
                    <Typography.Paragraph className="adm-listy-title">
                      <Link href={recordHref}>{String(record.reference || record.name || record.email || "Record")}</Link>
                    </Typography.Paragraph>
                    <Typography.Text type="secondary">
                      {key === "orders" ? [record.customerName, record.paymentStatus].filter(Boolean).join(" · ") : [record.email, record.subject].filter(Boolean).join(" · ")}
                    </Typography.Text>
                  </div>
                  <StatusChip value={String(key === "orders" ? record.fulfillmentStatus || record.status || "" : record.status || "new")} />
                </div>;
              }}
            /> : <Empty description={`No ${key} yet`} />}
          </Card>
        </Col>;
      })}
    </Row>
  </>;
}
