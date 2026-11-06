"use client";

import { useMemo } from "react";
import { Card, Col, Empty, Row, Skeleton, theme } from "antd";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { AdminDashboardOverview } from "@/services/api";

export function OrderCharts({
  overview,
  loading,
}: {
  overview?: AdminDashboardOverview | null;
  loading?: boolean;
}) {
  const { token } = theme.useToken();
  const paymentData = useMemo(() => {
    const colors = [token.colorSuccess, token.colorWarning, token.colorError, token.colorInfo];
    return (overview?.payments.byStatus ?? []).map((payment, index) => ({
      name: `${payment.status} · ${payment.paymentMethod}`,
      value: payment.count,
      fill: colors[index % colors.length],
    }));
  }, [overview?.payments.byStatus, token.colorError, token.colorInfo, token.colorSuccess, token.colorWarning]);

  const salesData = overview?.salesByDay.map((day) => ({
    ...day,
    label: `${day.date.slice(5)} · ${day.currency}`,
  })) ?? [];

  return (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} xl={14}>
        <Card className="adm-antd-card" title="Orders and sales by day">
          {loading ? <Skeleton active /> : salesData.length ? (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="orders" allowDecimals={false} />
                  <YAxis yAxisId="revenue" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="orders" dataKey="orderCount" name="Orders" fill={token.colorPrimary} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="orders" dataKey="paidOrders" name="Paid orders" fill={token.colorSuccess} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="revenue" dataKey={(row: typeof salesData[number]) => Number(row.revenue)} name="Revenue" fill={token.colorWarning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty description="No sales in this period" />}
        </Card>
      </Col>
      <Col xs={24} xl={10}>
        <Card className="adm-antd-card" title="Payments by status and method">
          {loading ? <Skeleton active /> : paymentData.length ? (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2} label>
                    {paymentData.map((item) => <Cell key={item.name} fill={item.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty description="No payment data" />}
        </Card>
      </Col>
    </Row>
  );
}
