"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Layers, Mail, Package, Palette, ShoppingBag,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Arts", icon: Package },
  { href: "/admin/artists", label: "Artists", icon: Palette },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/contacts", label: "Messages", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="adm-side">
      <Link className="adm-brand" href="/" aria-label="Niyo Arts home">
        <Image src="/niyo-art-white.png" alt="Niyo Arts Gallery" width={200} height={130} priority />
      </Link>
      <nav aria-label="Admin sections">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const current = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link href={href} className="adm-nav" key={href} aria-current={current ? "page" : undefined}>
              <Icon /> <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
