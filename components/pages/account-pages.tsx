"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Alert, App, Button, Card, Descriptions, Input, Listy, Space, Tag, Typography } from "antd";
import { useAuth } from "@/components/site-provider";
import { ApiRequestError, getOrder, getOrders, requestPasswordReset, resetPassword } from "@/services/api";
import type { ApiOrder } from "@/services/api";
import {
  ArrowLeftOutlined, ArrowRightOutlined, ArrowUpOutlined, CheckOutlined, CopyOutlined,
  CreditCardOutlined, EnvironmentOutlined, EyeInvisibleOutlined, EyeOutlined, InboxOutlined,
  KeyOutlined, LoadingOutlined, LockOutlined, LogoutOutlined, MailOutlined, MobileOutlined,
  PhoneOutlined, UserOutlined,
} from "@ant-design/icons";
import { formatPrice, useResource } from "./shared";
import { Generic } from "./static-pages";

/* -------------------------------------------------------------------------- */
/*  Shared tokens & helpers                                                    */
/* -------------------------------------------------------------------------- */

const GOLD = "#d4af37";
const card = "rounded-3xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(24,24,27,0.25)]";
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37]";

function toneFor(value?: string) {
  const s = (value || "").toLowerCase();
  if (["paid", "successful", "success", "completed", "delivered", "confirmed"].includes(s)) return "green";
  if (s.includes("pending") || ["processing", "awaiting"].includes(s)) return "amber";
  if (["failed", "cancelled", "canceled", "refunded", "declined"].includes(s)) return "rose";
  if (["shipped", "dispatched", "in_transit"].includes(s)) return "sky";
  return "zinc";
}

// "pending_payment" -> "Pending payment"
function pretty(value?: string) {
  if (!value) return "Unknown";
  const t = value.replace(/[_-]+/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ label, value }: { label?: string; value?: string }) {
  const tone = toneFor(value);
  return (
    <Tag color={tone === "green" ? "success" : tone === "amber" ? "warning" : tone === "rose" ? "error" : tone === "sky" ? "processing" : "default"}>
      {label ? `${label}: ` : ""}{pretty(value)}
    </Tag>
  );
}

function Perforation() {
  return (
    <div className="relative h-0" aria-hidden="true">
      <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-zinc-100" />
      <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-zinc-100" />
      <div className="mx-6 border-t-2 border-dashed border-zinc-200" />
    </div>
  );
}

function Shell({ children, back }: { children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        {back && (
          <Link
            href={back.href}
            className={`mb-5 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 ${focusRing}`}
          >
            <ArrowLeftOutlined />
            {back.label}
          </Link>
        )}
        {children}
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <div className={`${card} animate-pulse p-8 motion-reduce:animate-none`}>
      <div className="h-4 w-24 rounded bg-zinc-100" />
      <div className="mt-3 h-8 w-56 rounded bg-zinc-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-28 rounded-full bg-zinc-100" />
        <div className="h-6 w-28 rounded-full bg-zinc-100" />
      </div>
      <div className="mt-10 h-24 rounded-xl bg-zinc-50" />
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { message } = App.useApp();
  return (
    <Button
      htmlType="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch (reason) {
          message.error(reason instanceof Error ? reason.message : "Unable to copy the order reference.");
        }
      }}
      size="small"
      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Auth: layout, art panel, fields                                            */
/* -------------------------------------------------------------------------- */

type Mode = "account" | "login" | "register" | "forgot-password" | "reset-password";

const COPY: Record<Exclude<Mode, "account">, { title: string; sub: string; art: string; artSub: string; cta: string }> = {
  login: {
    title: "Welcome back",
    sub: "Sign in to track your orders and pick up where you left off.",
    art: "Good to see you again.",
    artSub: "Your saved works and orders are right where you left them.",
    cta: "Sign in",
  },
  register: {
    title: "Create your account",
    sub: "Save works you love, check out faster and follow every order.",
    art: "Start your collection.",
    artSub: "Original pieces from artists, delivered with care.",
    cta: "Create account",
  },
  "forgot-password": {
    title: "Forgot your password?",
    sub: "Enter your email and we’ll send you a link to reset it.",
    art: "We’ll get you back in.",
    artSub: "It only takes a minute.",
    cta: "Send reset link",
  },
  "reset-password": {
    title: "Set a new password",
    sub: "Choose a password you haven’t used before.",
    art: "Almost there.",
    artSub: "One new password and you’re back in the gallery.",
    cta: "Update password",
  },
};

function safeReturnTo() {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function passwordScore(pw: string) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return Math.max(1, score);
}
const LEVELS = ["", "Weak", "Fair", "Good", "Strong"];
const BAR_COLORS = ["", "bg-rose-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-600"];

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  id: string;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
};

function Field({ id, label, icon, trailing, ...input }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <Input id={id} className="auth-antd-input" prefix={icon} suffix={trailing} {...input} />
      </div>
    </div>
  );
}

// A small gallery wall: three hung frames
function GalleryArt({ title, text }: { title: string; text: string }) {
  const frame = "absolute border border-[#d4af37]/60 bg-zinc-800 p-2 shadow-[0_20px_30px_-12px_rgba(0,0,0,0.6)]";
  const mat = "h-full w-full bg-gradient-to-br";
  return (
    <aside className="auth-art relative hidden flex-col justify-between overflow-hidden bg-zinc-900 p-12 lg:flex" aria-hidden="true">
      <Link href="/" className="relative z-10 text-lg font-semibold tracking-tight text-white">Niyo</Link>

      <div className="relative mx-auto my-8 h-[26rem] w-full max-w-md">
        <div className={`${frame} left-0 top-6 h-56 w-40`}><div className={`${mat} from-amber-200/70 via-orange-300/40 to-zinc-700`} /></div>
        <div className={`${frame} right-2 top-0 h-40 w-52`}><div className={`${mat} from-sky-300/50 via-zinc-600 to-zinc-800`} /></div>
        <div className={`${frame} bottom-0 left-24 h-44 w-44`}><div className={`${mat} from-rose-300/50 via-zinc-600 to-amber-200/40`} /></div>
      </div>

      <div className="relative z-10 max-w-sm">
        <p className="text-3xl font-semibold leading-tight tracking-tight text-white">{title}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">{text}</p>
      </div>
    </aside>
  );
}

function AuthLayout({ art, children }: { art: { title: string; text: string }; children: ReactNode }) {
  return (
    <main className="auth-page">
      <GalleryArt title={art.title} text={art.text} />
      <div className="auth-panel">
        <div className="auth-card">
          <Link href="/" className="mb-6 inline-block text-lg font-semibold tracking-tight text-zinc-900 lg:hidden">Niyo</Link>
          <div className={`${card} p-7 sm:p-10`}>{children}</div>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  AccountPage (profile, login, register, forgot, reset)                      */
/* -------------------------------------------------------------------------- */

export function AccountPage({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { user, authLoading, login, register, logout } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", token: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenFromUrl, setTokenFromUrl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: orders, error: ordersError, loading: ordersLoading } = useResource(
    () => (mode === "account" && user ? getOrders().then(({ data }) => data) : Promise.resolve([] as ApiOrder[])),
    [mode, user?.id],
  );

  useEffect(() => {
    if (mode !== "reset-password") return;
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      setForm((current) => ({ ...current, token }));
      setTokenFromUrl(true);
    }
  }, [mode]);

  /* ------------------------------ Signed-in account ------------------------------ */
  if (mode === "account" && user) {
    const initials = user.name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    return (
      <Shell>
        <article className={card}>
          <header className="flex items-center gap-4 px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-zinc-900"
              style={{ backgroundColor: GOLD }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900">{user.name}</h1>
              <p className="truncate text-sm text-zinc-500">{user.email}</p>
            </div>
          </header>

          <Perforation />

          <section className="px-6 pt-8 sm:px-10" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="text-base font-semibold text-zinc-900">Profile</h2>
            <dl className="mt-4 divide-y divide-zinc-100 text-sm">
              <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Email</dt><dd className="break-all text-right text-zinc-900">{user.email}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Phone</dt><dd className="text-zinc-900">{user.phone || "Not added"}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Account type</dt><dd className="text-zinc-900">{pretty(user.role)}</dd></div>
            </dl>
          </section>

          <section className="px-6 pt-8 sm:px-10" aria-labelledby="recent-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="recent-heading" className="text-base font-semibold text-zinc-900">Recent orders</h2>
              <Link href="/orders" className={`rounded text-sm font-medium text-zinc-500 hover:text-zinc-900 ${focusRing}`}>View all</Link>
            </div>

            {ordersLoading && <p role="status" className="mt-4 text-sm text-zinc-500">Loading orders…</p>}
            {ordersError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{ordersError}</p>}

            {orders?.length ? (
              <ul className="mt-4 space-y-2">
                {orders.map((order) => (
                  <li key={order.reference}>
                    <Link
                      href={`/orders/${encodeURIComponent(order.reference)}`}
                      className={`group flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 transition hover:bg-zinc-100 ${focusRing}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-semibold text-zinc-900">{order.reference}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <StatusBadge value={order.status} />
                          <StatusBadge value={order.paymentStatus} />
                        </div>
                      </div>
                      <strong className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                        {formatPrice(order.total, order.currency)}
                      </strong>
                      <ArrowRightOutlined className="shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-900" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              !ordersLoading && (
                <div className="mt-4 flex flex-col items-center rounded-2xl bg-zinc-50 py-10 text-center">
                  <InboxOutlined className="text-2xl text-zinc-400" />
                  <p className="mt-3 max-w-xs text-sm text-zinc-500">No orders yet. When you buy a work, it will show up here.</p>
                </div>
              )
            )}
          </section>

          <footer className="space-y-3 px-6 pb-8 pt-8 sm:px-10 sm:pb-10">
            {user.role === "admin" && (
              <Button href="/admin" type="primary" block icon={<ArrowUpOutlined />}>Studio dashboard</Button>
            )}
            <Button block icon={<LogoutOutlined />} onClick={logout}>Sign out</Button>
          </footer>
        </article>
      </Shell>
    );
  }

  if (authLoading) {
    return (
      <Shell>
        <div role="status" aria-label="Checking your account"><Skeleton /></div>
      </Shell>
    );
  }

  /* ------------------------------ Already signed in ------------------------------ */
  if (user || mode === "account") {
    return (
      <AuthLayout art={{ title: COPY.login.art, text: COPY.login.artSub }}>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{user ? "You’re signed in" : "Sign in required"}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
          {user ? `Signed in as ${user.email}.` : "Sign in to view your profile, cart and orders."}
        </p>
        <div className="auth-stack mt-8 space-y-3">
          {user ? (
            <Button className="auth-action-button" type="primary" href="/account" icon={<ArrowUpOutlined />}>Go to your account</Button>
          ) : (
            <>
              <Button className="auth-action-button" type="primary" href="/login" icon={<ArrowUpOutlined />}>Sign in</Button>
              <Button className="auth-action-button" href="/register">Create an account</Button>
            </>
          )}
        </div>
      </AuthLayout>
    );
  }

  /* --------------------------------- Auth forms --------------------------------- */
  const copy = COPY[mode as Exclude<Mode, "account">];
  const needsPassword = mode !== "forgot-password";
  const showStrength = (mode === "register" || mode === "reset-password") && form.password.length > 0;
  const score = passwordScore(form.password);

  const passwordToggle = (
    <Button
      type="text"
      size="small"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
      icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
    />
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
        router.replace(safeReturnTo());
      } else if (mode === "forgot-password") {
        const result = await requestPasswordReset(form.email.trim());
        setMessage(result.message || "If an account exists for that email, a reset link is on its way.");
        setDone(true);
      } else if (mode === "reset-password") {
        await resetPassword(form.token, form.password);
        setMessage("Your password has been changed. You can now sign in with it.");
        setDone(true);
      } else {
        await login(form.email.trim(), form.password);
        router.replace(safeReturnTo());
      }
    } catch (reason) {
      setError(
        reason instanceof ApiRequestError && reason.validationErrors.length
          ? reason.validationErrors.map((item) => `${item.path}: ${item.message}`).join(" ")
          : reason instanceof Error ? reason.message : "Unable to complete the account request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout art={{ title: copy.art, text: copy.artSub }}>
      {done ? (
        <div role="status" className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 ring-8 ring-emerald-100">
            <CheckOutlined className="text-2xl text-white" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
            {mode === "forgot-password" ? "Check your inbox" : "Password updated"}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-zinc-500">{message}</p>
          <Button className="auth-action-button mt-8" type="primary" href="/login" icon={<ArrowUpOutlined />}>
            {mode === "forgot-password" ? "Back to sign in" : "Sign in now"}
          </Button>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{copy.title}</h1>
          <p className="auth-sub mt-2 text-[15px] leading-relaxed text-zinc-500">{copy.sub}</p>

          <form className="auth-form mt-8" onSubmit={onSubmit}>
            {mode === "register" && (
              <Field id="auth-name" label="Full name" icon={<UserOutlined />} placeholder="Jane Doe"
                required minLength={2} maxLength={160} autoComplete="name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}

            {mode !== "reset-password" && (
              <Field id="auth-email" label="Email address" icon={<MailOutlined />} placeholder="you@example.com"
                required type="email" maxLength={254} autoComplete="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            )}

            {mode === "register" && (
              <Field id="auth-phone" label="Phone number" icon={<PhoneOutlined />} placeholder="+250 7xx xxx xxx"
                required type="tel" minLength={5} maxLength={40} autoComplete="tel"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            )}

            {mode === "reset-password" && !tokenFromUrl && (
              <Field id="auth-token" label="Reset token" icon={<KeyOutlined />} placeholder="Paste the token from your email"
                required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
            )}

            {needsPassword && (
              <div>
                <Field id="auth-password" label={mode === "reset-password" ? "New password" : "Password"} icon={<LockOutlined />}
                  placeholder="At least 8 characters" trailing={passwordToggle}
                  required minLength={8} maxLength={128} type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {showStrength && (
                  <div className="mt-3" aria-live="polite">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? BAR_COLORS[score] : "bg-zinc-200"}`} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      {LEVELS[score]}{score < 3 ? ". Use 8+ characters with numbers and capitals." : ""}
                    </p>
                  </div>
                )}
              </div>
            )}

            {mode === "login" && (
              <div className="-mt-1 text-right">
                <Link href="/forgot-password" className={`auth-forgot rounded text-sm font-medium text-zinc-500 hover:text-zinc-900 ${focusRing}`}>
                  Forgot password?
                </Link>
              </div>
            )}

            {error && <Alert showIcon type="error" title={error} />}

            <Button className="auth-submit" type="primary" htmlType="submit" loading={submitting} icon={!submitting ? <ArrowUpOutlined /> : undefined}>
              {submitting ? "Please wait…" : copy.cta}
            </Button>
          </form>

          <p className="auth-switch mt-6 text-center text-sm text-zinc-500">
            {mode === "login" && <>New to Niyo? <Link className="font-semibold text-zinc-900 underline-offset-4 hover:underline" href="/register">Create an account</Link></>}
            {mode === "register" && <>Already have an account? <Link className="font-semibold text-zinc-900 underline-offset-4 hover:underline" href="/login">Sign in</Link></>}
            {(mode === "forgot-password" || mode === "reset-password") && <>Remembered it? <Link className="font-semibold text-zinc-900 underline-offset-4 hover:underline" href="/login">Back to sign in</Link></>}
          </p>
        </>
      )}
    </AuthLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*  OrderDetail                                                                */
/* -------------------------------------------------------------------------- */

type OrderItem = {
  id: string;
  productSlug: string;
  title: string;
  artistName?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: string;
};

type PaymentAttempt = { id: string; reference: string; paymentUrl?: string; status: string; createdAt: string };

type Order = {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: { address?: string; city?: string; postcode?: string; country?: string };
  paymentMethod?: string;
  paymentProvider?: string;
  paymentPhone?: string;
  paymentUrl?: string;
  total: string;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
  paymentAttempts?: PaymentAttempt[];
};

function DetailBlock({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <Card size="small" title={<Space><Icon className="text-zinc-400" />{title}</Space>}>{children}</Card>
  );
}

export function OrderDetail({ reference }: { reference: string }) {
  const { user, authLoading } = useAuth();
  const { data: order, error, loading } = useResource<Order | null>(
    () => (user ? getOrder(reference).then(({ data }) => data as unknown as Order) : Promise.resolve(null)),
    [reference, user?.id],
  );

  if (authLoading) {
    return (
      <Shell back={{ href: "/orders", label: "All orders" }}>
        <div role="status" aria-label="Checking account"><Skeleton /></div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Generic title="Sign in required" eyebrow="Niyo / order">
        <Button type="primary" href="/login" icon={<ArrowUpOutlined />}>Sign in</Button>
      </Generic>
    );
  }

  const money = (value: string | number) => formatPrice(Number(value), order?.currency ?? "RWF");
  const itemCount = order?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;
  const awaitingPayment = order?.paymentStatus === "pending" && !!order.paymentUrl;
  const addr = order?.shippingAddress;
  const cityLine = [addr?.city, addr?.postcode && addr.postcode !== "000" ? addr.postcode : null].filter(Boolean).join(", ");

  return (
    <Shell back={{ href: "/orders", label: "All orders" }}>
      {loading && <div role="status" aria-label="Loading order"><Skeleton /></div>}

      {error && <Alert showIcon type="error" title="We couldn’t load this order" description={error} action={<Button href="/orders">Back to orders</Button>} />}

      {order && (
        <article className={card}>
          <header className="px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
            <p className="text-sm text-zinc-500">Order placed {formatDate(order.createdAt)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="break-all font-mono text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">{order.reference}</h1>
              <CopyButton value={order.reference} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge label="Order" value={order.status} />
              <StatusBadge label="Payment" value={order.paymentStatus} />
            </div>

            {awaitingPayment && (
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-amber-900">We haven’t received your payment yet. Finish paying to confirm this order.</p>
                <Button type="primary" href={order.paymentUrl} icon={<ArrowUpOutlined />}>Complete payment</Button>
              </div>
            )}
          </header>

          <Perforation />

          <section className="px-6 pt-8 sm:px-10" aria-labelledby="items-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="items-heading" className="text-base font-semibold text-zinc-900">Items</h2>
              {itemCount > 0 && <p className="text-sm text-zinc-500">{itemCount} {itemCount === 1 ? "item" : "items"}</p>}
            </div>

            {order.items?.length ? (
              <Listy items={order.items} virtual={false} rowKey="id" itemRender={(item) => (
                <div className="acct-listy-order-row">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.title} className="acct-order-image" />
                    : <InboxOutlined className="text-xl text-zinc-400" />}
                  <div className="acct-listy-order-meta">
                    <Link href={`/shop/${item.productSlug}`}>{item.title}</Link>
                    <span className="text-sm text-zinc-500">{item.artistName && <>{item.artistName} · </>}{money(item.unitPrice)} × {item.quantity}</span>
                  </div>
                  <strong>{money(Number(item.unitPrice) * item.quantity)}</strong>
                </div>
              )} />
            ) : (
              <div className="mt-4 flex flex-col items-center rounded-2xl bg-zinc-50 py-10 text-center">
                <InboxOutlined className="text-2xl text-zinc-400" />
                <p className="mt-3 text-sm text-zinc-500">No items are listed on this order.</p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between rounded-2xl bg-zinc-900 px-5 py-4">
              <span className="text-sm text-zinc-300">Total</span>
              <span className="text-xl font-semibold tabular-nums tracking-tight text-[#d4af37]">{money(order.total)}</span>
            </div>
          </section>

          <section className="grid gap-3 px-6 pb-8 pt-6 sm:grid-cols-2 sm:px-10" aria-label="Order details">
            <DetailBlock icon={UserOutlined} title="Customer">
              <Descriptions size="small" column={1} items={[
                { key: "name", label: "Name", children: order.customerName },
                { key: "email", label: "Email", children: order.customerEmail },
                ...(order.customerPhone ? [{ key: "phone", label: "Phone", children: order.customerPhone }] : []),
              ]} />
            </DetailBlock>

            <DetailBlock icon={EnvironmentOutlined} title="Shipping to">
              <Descriptions size="small" column={1} items={[
                ...(addr?.address ? [{ key: "address", label: "Address", children: addr.address }] : []),
                ...(cityLine ? [{ key: "city", label: "City / postal code", children: cityLine }] : []),
                ...(addr?.country ? [{ key: "country", label: "Country", children: addr.country }] : []),
              ]} />
            </DetailBlock>

            <div className="sm:col-span-2">
              <DetailBlock icon={order.paymentMethod === "mobile_money" ? MobileOutlined : CreditCardOutlined} title="Payment">
                <Descriptions size="small" column={1} items={[
                  { key: "method", label: "Method", children: `${pretty(order.paymentMethod)}${order.paymentProvider ? ` via ${order.paymentProvider}` : ""}` },
                  ...(order.paymentPhone ? [{ key: "phone", label: "Payment phone", children: order.paymentPhone }] : []),
                ]} />
              </DetailBlock>
            </div>
          </section>

          {!!order.paymentAttempts?.length && (
            <section className="border-t border-zinc-100 px-6 pb-8 pt-6 sm:px-10" aria-labelledby="attempts-heading">
              <h2 id="attempts-heading" className="text-base font-semibold text-zinc-900">Payment attempts</h2>
              <Listy items={order.paymentAttempts} virtual={false} rowKey="id" itemRender={(attempt) => (
                <div className="acct-listy-attempt-row">
                  <div>
                    <Typography.Text strong>{attempt.reference}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">{formatDate(attempt.createdAt)}</Typography.Text>
                  </div>
                  <StatusBadge value={attempt.status} />
                </div>
              )} />
            </section>
          )}
        </article>
      )}
    </Shell>
  );
}