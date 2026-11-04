"use client";

import Link from "next/link";
import { ArrowUpOutlined } from "@ant-design/icons";
import { Button, Result, Spin } from "antd";
import { useAuth } from "@/components/site-provider";
import { AdminSidebar } from "./admin-sidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();

  if (authLoading) return <div className="admin-auth-loading" role="status"><Spin size="large" /><span>Checking administrator access…</span></div>;
  if (!user) {
    return <Result status="403" title="Sign in required" subTitle="Sign in with an administrator account to continue."
      extra={<Link href="/login"><Button type="primary" icon={<ArrowUpOutlined />}>Sign in</Button></Link>} />;
  }
  if (user.role !== "admin") {
    return <Result status="403" title="Access denied" subTitle="This area is restricted to administrator accounts." />;
  }

  return <div className="adm"><AdminSidebar /><main className="adm-main">{children}</main></div>;
}
