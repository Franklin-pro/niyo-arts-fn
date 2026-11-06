"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useState } from "react";
import { Alert, Badge, Button, Drawer, Menu } from "antd";
import {
  SearchOutlined, ShoppingOutlined, UserOutlined,
} from "@ant-design/icons";
import { useAuth, useCart } from "@/components/site-provider";
import { nav } from "./pages/shared";

const RouteLoading = () => <p className="page-intro" role="status">Loading page…</p>;
const HomePage = dynamic(() => import("./pages/home-page").then((module) => module.HomePage), { loading: RouteLoading });
const { Listing, ProductPage, Collections, Artists } = {
  Listing: dynamic(() => import("./pages/catalog-pages").then((module) => module.Listing), { loading: RouteLoading }),
  ProductPage: dynamic(() => import("./pages/catalog-pages").then((module) => module.ProductPage), { loading: RouteLoading }),
  Collections: dynamic(() => import("./pages/catalog-pages").then((module) => module.Collections), { loading: RouteLoading }),
  Artists: dynamic(() => import("./pages/catalog-pages").then((module) => module.Artists), { loading: RouteLoading }),
};
const { Cart, Checkout } = {
  Cart: dynamic(() => import("./pages/commerce-pages").then((module) => module.Cart), { loading: RouteLoading }),
  Checkout: dynamic(() => import("./pages/commerce-pages").then((module) => module.Checkout), { loading: RouteLoading }),
};
const { AccountPage, OrderDetail } = {
  AccountPage: dynamic(() => import("./pages/account-pages").then((module) => module.AccountPage), { loading: RouteLoading }),
  OrderDetail: dynamic(() => import("./pages/account-pages").then((module) => module.OrderDetail), { loading: RouteLoading }),
};
const { About, Contact, Generic } = {
  About: dynamic(() => import("./pages/static-pages").then((module) => module.About), { loading: RouteLoading }),
  Contact: dynamic(() => import("./pages/static-pages").then((module) => module.Contact), { loading: RouteLoading }),
  Generic: dynamic(() => import("./pages/static-pages").then((module) => module.Generic), { loading: RouteLoading }),
};
const PaymentResult = dynamic(() => import("./pages/payment-result"), { loading: RouteLoading });
const FoundationPage = dynamic(() => import("./pages/foundation").then((module) => module.FoundationPage), { loading: RouteLoading });
const CafePage = dynamic(() => import("./pages/cafe").then((module) => module.CafePage), { loading: RouteLoading });

function Header({ cart, open, onMenu, user, authLoading }: { cart: number; open: boolean; onMenu: () => void; user: ReturnType<typeof useAuth>["user"]; authLoading: boolean }) {
  const navItems = nav.map(([label, href]) => ({ key: href, label: <Link href={href}>{label}</Link> }));
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Niyo Arts home">
        <Image className="brand-logo" src="/niyo-art-white.png" alt="Niyo Arts Gallery" width={250} height={143} priority />
      </Link>
      <Menu className="main-nav" mode="horizontal" selectable={false} items={navItems} />
      <div className="header-actions">
        <Button href="/search" type="text" aria-label="Search" icon={<SearchOutlined />} />
        {user ? (
          <Button href="/account" type="text" aria-label="Account" icon={<UserOutlined />} />
        ) : !authLoading ? (
          <Link className="header-login" href="/login">Login</Link>
        ) : null}
        {/* <Button href="/account/wishlist" type="text" aria-label="Wishlist" icon={<HeartOutlined />} /> */}
        <Badge count={cart} size="small" offset={[-3, 5]}>
          <Button href="/cart" type="text" aria-label={`Cart, ${cart} items`} icon={<ShoppingOutlined />} />
        </Badge>
        {/* <Button className="menu-toggle" type="text" onClick={onMenu}
          aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}
          icon={<MenuOutlined />} /> */}
      </div>
      <Drawer title="Explore Niyo Arts" placement="right" open={open} onClose={onMenu} className="store-nav-drawer">
        <Menu mode="vertical" selectable={false} items={navItems} onClick={onMenu} />
      </Drawer>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark footer-wordmark" href="/" aria-label="Niyo Arts home">
          <Image className="brand-logo footer-brand-logo" src="/niyo-arts-logo.png" alt="Niyo Arts Gallery" width={250} height={143} />
        </Link>
        <p>Art Center and Café · Kigali, Rwanda</p>
      </div>
      <div className="footer-links">
        <div>
          <p>Explore</p>
          {nav.slice(0, 4).map(([l, h]) => (
            <Link key={h} href={h}>{l}</Link>
          ))}
        </div>
        <div>
          <p>Info</p>
          <Link href="/about">About Niyo</Link>
          {/* <Link href="/shipping">Shipping & returns</Link> */}
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <p>Follow</p>
          <Link href="https://www.instagram.com/niyoartscenter/" target="_blank" rel="noopener noreferrer">
            Instagram
          </Link>
          <Link href="https://twitter.com/niyoartscenter" target="_blank" rel="noopener noreferrer">
            Twitter
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Niyo Arts all rights reserved</span>
        <span>25 KG 572 street, Kigali, Rwanda · +250 788 932 111</span>
        <span>USD / EN</span>
      </div>
    </footer>
  );
}

export default function SiteApp({ path }: { path: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const {
    items: cart,
    add,
    remove,
    clear,
    orderPlaced,
    subtotal: cartSubtotal,
    currency: cartCurrency,
    loading: cartLoading,
    error: cartError,
    cartId,
    clearError,
  } = useCart();
  const { user, authLoading } = useAuth();
  const addAndCheckout = async (product: Parameters<typeof add>[0]) => {
    await add(product);
    router.push("/checkout");
  };
  const route = path.replace(/^\//, "").split("/");
  const isHome = path === "/" || !path;
  const showStorefrontChrome = route[0] !== "admin";
  let body: React.ReactNode;

  if (isHome) {
    body = <HomePage onAdd={addAndCheckout} adding={cartLoading} />;
  } else if (route[0] === "shop" && route[1]) {
    body = <ProductPage slug={route[1]} onAdd={addAndCheckout} adding={cartLoading} />;
  } else if (route[0] === "shop" || route[0] === "gallery") {
    body = <Listing mode={route[0]} onAdd={addAndCheckout} adding={cartLoading} />;
  } else if (route[0] === "search") {
    body = <Listing mode="search" onAdd={addAndCheckout} adding={cartLoading} />;
  } else if (route[0] === "cart") {
    body = <Cart
      items={cart}
      remove={remove}
      clear={clear}
      subtotal={cartSubtotal}
      currency={cartCurrency}
      loading={cartLoading || authLoading}
      error={cartError}
    />;
  } else if (route[0] === "checkout") {
    body = <Checkout
      items={cart}
      cartId={cartId}
      subtotal={cartSubtotal}
      currency={cartCurrency}
      loading={cartLoading}
      orderPlaced={orderPlaced}
    />;
  } else if (route[0] === "payment-result") {
    body = (
      <Suspense fallback={<p className="page-intro" role="status">Loading payment result…</p>}>
        <PaymentResult />
      </Suspense>
    );
  } else if (route[0] === "collections") {
    body = <Collections slug={route[1]} />;
  } else if (route[0] === "artists") {
    body = <Artists slug={route[1]} />;
  } else if (route[0] === "about") {
    body = <About />;
  } else if (route[0] === "account") {
    body = <AccountPage mode="account" />;
  } else if (route[0] === "login") {
    body = <AccountPage mode="login" />;
  } else if (route[0] === "register") {
    body = <AccountPage mode="register" />;
  } else if (route[0] === "forgot-password") {
    body = <AccountPage mode="forgot-password" />;
  } else if (route[0] === "reset-password") {
    body = <AccountPage mode="reset-password" />;
  } else if (route[0] === "orders" && route[1]) {
    body = <OrderDetail reference={route[1]} />;
  } else if (route[0] === "orders") {
    body = <AccountPage mode="account" />;
  } else if (route[0] === "shipping") {
    body = <Generic title="Shipping & returns" eyebrow="Niyo / info" />;
  } else if (route[0] === "contact") {
    body = <Contact />;
  }
  else if (route[0] === "foundation") {
    body = <FoundationPage />;
  }  
  else if (route[0] === "cafe") {
    body = <CafePage />;
  }
  else {
    body = <Generic title="Page not found" eyebrow="Niyo / 404" />;
  }

  return (
    <>
      {showStorefrontChrome && (
        <>
          <Header cart={cart.length} open={menu} onMenu={() => setMenu(!menu)} user={user} authLoading={authLoading} />
          {cartError && (
            <Alert
              type="error"
              showIcon
              closable
              onClose={clearError}
              title={cartError}
              description={!user && <Link href="/login?returnTo=%2Fcart">Sign in to restore your cart</Link>}
            />
          )}
        </>
      )}
      {body}
      {showStorefrontChrome && <Footer />}
    </>
  );
}
