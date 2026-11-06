"use client";

import Link from "next/link";
import { useAuth } from "@/components/site-provider";
import { Alert, Card, Col, Empty, Row, Skeleton, Statistic, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { formatAdminDate, formatAdminPrice } from "@/lib/admin-utils";
import { adminApi, type AdminDashboardOverview } from "@/services/api";
import { OrderCharts } from "@/components/order-charts";

export function DashboardOverview() {
  const { user } = useAuth();
  const { data: overview, error, loading } = useAdminResource(async (): Promise<AdminDashboardOverview> => {
    const response = await adminApi.adminDashboard.overview();
    return response.data;
  }, []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name.split(" ")[0] || "there";

  const recentOrderColumns: TableColumnsType<AdminDashboardOverview["recentOrders"][number]> = [
    {
      title: "Order",
      dataIndex: "reference",
      key: "reference",
      render: (reference: string) => (
        <Link href={`/admin/orders/${encodeURIComponent(reference)}`}>{reference}</Link>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => <div>
        <Typography.Text strong>{order.customerName}</Typography.Text><br />
        <Typography.Text type="secondary">{order.customerEmail}</Typography.Text>
      </div>,
    },
    {
      title: "Total",
      key: "total",
      render: (_, order) => formatAdminPrice(order.total, order.currency),
    },
    {
      title: "Order status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusChip value={status} />,
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status: string) => <StatusChip value={status} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => formatAdminDate(createdAt),
    },
  ];

  return <>
    <AdminPageHeader title={`${greeting}, ${firstName}`} description="Here’s what’s happening in the gallery today." />
    {error && <Alert showIcon type="error" title={error} />}

    <Typography.Title level={2}>Overview</Typography.Title>
    <Typography.Paragraph type="secondary">
      {overview ? `${overview.period.from} – ${overview.period.to}` : "Loading dashboard summary…"}
    </Typography.Paragraph>
    <Row gutter={[16, 16]} className="adm-stat-grid" aria-busy={loading}>
      {[
        { label: "Total orders", value: overview?.summary.totalOrders ?? 0 },
        { label: "Paid orders", value: overview?.summary.paidOrders ?? 0 },
        { label: "Pending payments", value: overview?.summary.pendingPayments ?? 0 },
      ].map(({ label, value }) => (
        <Col xs={12} sm={8} lg={6} key={label}>
          <Card className="adm-antd-stat"><Statistic title={label} value={loading ? 0 : value} /></Card>
        </Col>
      ))}
      <Col xs={24} sm={8} lg={6}>
        <Card className="adm-antd-stat" title="Sales">
          {loading ? <Skeleton active paragraph={false} /> : overview?.summary.salesByCurrency.length
            ? overview.summary.salesByCurrency.map((sale) => (
              <Statistic key={sale.currency} value={formatAdminPrice(sale.amount, sale.currency)} />
            ))
            : <Typography.Text type="secondary">No sales yet</Typography.Text>}
        </Card>
      </Col>
    </Row>
    <OrderCharts overview={overview} loading={loading} />
    <Card
      title="Recent orders"
      extra={<Link href="/admin/orders">View all orders</Link>}
      className="adm-antd-card adm-dashboard-panels"
    >
      <Table
        size="small"
        scroll={{ x: 1000 }}
        rowKey="reference"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        dataSource={overview?.recentOrders ?? []}
        columns={recentOrderColumns}
        loading={loading}
        locale={{ emptyText: <Empty description="No recent orders" /> }}
      />
    </Card>

  </>;
}