"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth, useCart } from "@/components/site-provider";
import { getHealth } from "@/services/api";
import { ArrowUpRight, Menu, Search, ShoppingBag, UserRound, Heart, X } from "lucide-react";
import { useResource, nav } from "./pages/shared";
import { Listing, ProductPage, Collections, Artists } from "./pages/catalog-pages";
import { Cart, Checkout } from "./pages/commerce-pages";
import { AccountPage, OrderDetail } from "./pages/account-pages";
import { AdminPage } from "./pages/admin-page";
import { About, Contact, Generic } from "./pages/static-pages";
import { HomePage } from "./pages/home-page";

function Header({ cart, open, onMenu, user, authLoading }: { cart: number; open: boolean; onMenu: () => void; user: ReturnType<typeof useAuth>["user"]; authLoading: boolean }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Niyo Arts home">
        <Image className="brand-logo" src="/niyo-art-white.png" alt="Niyo Arts Gallery" width={250} height={143} priority />
      </Link>
      <nav className="main-nav" aria-label="Main">
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link href="/search" aria-label="Search"><Search /></Link>
        {user ? (
          <Link href="/account" aria-label="Account"><UserRound /></Link>
        ) : !authLoading ? (
          <Link className="header-login" href="/login">Login</Link>
        ) : null}
        <Link href="/account/wishlist" aria-label="Wishlist"><Heart /></Link>
        <Link href="/cart" aria-label="Cart">
          <ShoppingBag />
          <small>{cart}</small>
        </Link>
        <button className="menu-toggle" onClick={onMenu} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
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
        <p>Art for the way you live.</p>
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
          <Link href="/shipping">Shipping & returns</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <p>Follow</p>
          <Link href="#">Instagram</Link>
          <Link href="#">Twitter</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Niyo Arts all rights reserved</span>
        <span>Rwanda · Kigali · Everywhere</span>
        <span>USD / EN</span>
      </div>
    </footer>
  );
}

export default function SiteApp({ path }: { path: string }) {
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
  const route = path.replace(/^\//, "").split("/");
  const isHome = path === "/" || !path;
  const showStorefrontChrome = route[0] !== "admin";
  const { error: healthError } = useResource(getHealth, []);

  let body: React.ReactNode;

  if (isHome) {
    body = <HomePage onAdd={add} signedIn={Boolean(user)} adding={cartLoading} />;
  } else if (route[0] === "shop" && route[1]) {
    body = <ProductPage slug={route[1]} onAdd={add} signedIn={Boolean(user)} adding={cartLoading} />;
  } else if (route[0] === "shop" || route[0] === "gallery") {
    body = <Listing mode={route[0]} onAdd={add} signedIn={Boolean(user)} adding={cartLoading} />;
  } else if (route[0] === "search") {
    body = <Listing mode="search" onAdd={add} signedIn={Boolean(user)} adding={cartLoading} />;
  } else if (route[0] === "cart") {
    body = <Cart
      items={cart}
      remove={remove}
      clear={clear}
      subtotal={cartSubtotal}
      currency={cartCurrency}
      loading={cartLoading}
      error={cartError}
      signedIn={Boolean(user)}
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
  } else if (route[0] === "admin") {
    body = <AdminPage section={route[1]} />;
  } else if (route[0] === "shipping") {
    body = <Generic title="Shipping & returns" eyebrow="Niyo / info" />;
  } else if (route[0] === "contact") {
    body = <Contact />;
  } else {
    body = <Generic title="Page not found" eyebrow="Niyo / 404" />;
  }

  return (
    <>
      {showStorefrontChrome && (
        <>
          <Header cart={cart.length} open={menu} onMenu={() => setMenu(!menu)} user={user} authLoading={authLoading} />
          {healthError && <p role="alert" className="field-error">{healthError}</p>}
          {cartError && (
            <p role="alert" className="field-error">
              {cartError} {!user && <Link href="/login?returnTo=%2Fcart">Sign in</Link>}
              <button type="button" aria-label="Dismiss cart error" onClick={clearError}><X /></button>
            </p>
          )}
          {menu && (
            <div className="mobile-menu">
              {nav.map(([l, h]) => (
                <Link onClick={() => setMenu(false)} key={h} href={h}>
                  {l}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      {body}
      {showStorefrontChrome && <Footer />}
    </>
  );
}
