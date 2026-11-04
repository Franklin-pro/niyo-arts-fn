"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppstoreOutlined, DashboardOutlined, MailOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons";
import { Menu } from "antd";

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
  return (
    <aside className="adm-side">
      <Link className="adm-brand" href="/" aria-label="Niyo Arts home">
        <Image src="/niyo-art-white.png" alt="Niyo Arts Gallery" width={200} height={130} priority />
      </Link>
      <Menu
        aria-label="Admin sections"
        mode="inline"
        selectedKeys={[links.find(({ href, exact }) => exact ? pathname === href : pathname.startsWith(href))?.href ?? "/admin"]}
        items={links.map(({ href, label, icon }) => ({
          key: href,
          icon,
          label: <Link href={href}>{label}</Link>,
        }))}
      />
    </aside>
  );
}
