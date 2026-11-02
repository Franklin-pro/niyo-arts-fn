"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/components/site-provider";
import { AdminSidebar } from "./admin-sidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();

  if (authLoading) return <p className="page-intro" role="status">Checking administrator access…</p>;
  if (!user) {
    return (
      <div className="page-intro">
        <h1>Sign in required</h1>
        <Link className="button-link" href="/login">Sign in <ArrowUpRight /></Link>
      </div>
    );
  }
  if (user.role !== "admin") {
    return <div className="page-intro"><h1>Access denied</h1><p>This area is restricted to administrator accounts.</p></div>;
  }

  return <div className="adm"><AdminSidebar /><main className="adm-main">{children}</main></div>;
}
