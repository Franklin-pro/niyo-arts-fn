"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MailOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Menu, message,Popconfirm } from "antd";
import { useAuth } from "@/components/site-provider";
import useApp from "antd/es/app/useApp";

const links = [
  { href: "/admin", label: "Overview", icon: <DashboardOutlined />, exact: true },
  { href: "/admin/products", label: "Arts", icon: <AppstoreOutlined /> },
  { href: "/admin/artists", label: "Artists", icon: <UserOutlined /> },
  { href: "/admin/collections", label: "Collections", icon: <AppstoreOutlined /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingOutlined /> },
  { href: "/admin/contacts", label: "Messages", icon: <MailOutlined /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const {message} = useApp();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      message.success(`Signed out ${user?.email ?? ""}`);
      router.push("/login");
      router.refresh();
    } catch {
      message.error("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="adm-side">
      <Link className="adm-brand" href="/" aria-label="Niyo Arts home">
        <Image src="/niyo-art-white.png" alt="Niyo Arts Gallery" width={200} height={130} priority />
      </Link>

      <Menu
        aria-label="Admin sections"
        mode="inline"
        selectedKeys={[
          links.find(({ href, exact }) => (exact ? pathname === href : pathname.startsWith(href)))?.href ?? "/admin",
        ]}
        items={links.map(({ href, label, icon }) => ({
          key: href,
          icon,
          label: <Link href={href}>{label}</Link>,
        }))}
      />

      <div className="adm-side-footer">

        <Popconfirm
          title="Sign out?"
          description="You'll need to sign in again to access the admin."
          okText="Sign out"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: signingOut }}
          onConfirm={handleSignOut}
          placement="topRight"
        >
          <Button
            block
            danger
            icon={<LogoutOutlined />}
            className="adm-logout"
            loading={signingOut}
          >
            Log out
          </Button>
        </Popconfirm>
      </div>
    </aside>
  );
}