"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useAuth } from "@/components/site-provider";
import { ApiRequestError, getOrder, getOrders, requestPasswordReset, resetPassword } from "@/services/api";
import type { ApiOrder } from "@/services/api";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, CreditCard, Eye, EyeOff, KeyRound,
  Loader2, Lock, LogOut, Mail, MapPin, PackageOpen, Phone, Smartphone, User,
} from "lucide-react";
import { formatPrice, useResource } from "./shared";
import { Generic } from "./static-pages";

/* -------------------------------------------------------------------------- */
/*  Shared tokens & helpers                                                    */
/* -------------------------------------------------------------------------- */

const GOLD = "#d4af37";
const card = "rounded-3xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(24,24,27,0.25)]";
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37]";
const goldBtn = `inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
const ghostBtn = `inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 ${focusRing}`;
const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#d4af37] focus:outline-none focus:ring-4 focus:ring-[#d4af37]/20";

type Tone = "green" | "amber" | "rose" | "sky" | "zinc";
const TONES: Record<Tone, { badge: string; dot: string }> = {
  green: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  amber: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  rose: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  sky: { badge: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  zinc: { badge: "bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" },
};

function toneFor(value?: string): Tone {
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
  const tone = TONES[toneFor(value)];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${tone.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label && <span className="opacity-70">{label}</span>}
      <span>{pretty(value)}</span>
    </span>
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
            <ArrowLeft className="h-4 w-4" />
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
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 ${focusRing}`}
    >
      {copied ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
    </button>
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

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
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
        <input id={id} className={`${inputCls} ${trailing ? "pr-12" : ""}`} {...input} />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
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
                      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-900" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              !ordersLoading && (
                <div className="mt-4 flex flex-col items-center rounded-2xl bg-zinc-50 py-10 text-center">
                  <PackageOpen className="h-8 w-8 text-zinc-400" />
                  <p className="mt-3 max-w-xs text-sm text-zinc-500">No orders yet. When you buy a work, it will show up here.</p>
                </div>
              )
            )}
          </section>

          <footer className="space-y-3 px-6 pb-8 pt-8 sm:px-10 sm:pb-10">
            {user.role === "admin" && (
              <Link href="/admin" className={goldBtn}>Studio dashboard <ArrowUpRight className="h-4 w-4" /></Link>
            )}
            <button type="button" onClick={logout} className={ghostBtn}><LogOut className="h-4 w-4" /> Sign out</button>
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
            <Link className={goldBtn} href="/account">Go to your account <ArrowUpRight className="h-4 w-4" /></Link>
          ) : (
            <>
              <Link className={goldBtn} href="/login">Sign in <ArrowUpRight className="h-4 w-4" /></Link>
              <Link className={ghostBtn} href="/register">Create an account</Link>
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
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 ${focusRing}`}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
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
            <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
            {mode === "forgot-password" ? "Check your inbox" : "Password updated"}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-zinc-500">{message}</p>
          <Link className={`${goldBtn} mt-8`} href="/login">
            {mode === "forgot-password" ? "Back to sign in" : "Sign in now"} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{copy.title}</h1>
          <p className="auth-sub mt-2 text-[15px] leading-relaxed text-zinc-500">{copy.sub}</p>

          <form className="auth-form mt-8" onSubmit={onSubmit}>
            {mode === "register" && (
              <Field id="auth-name" label="Full name" icon={<User />} placeholder="Jane Doe"
                required minLength={2} maxLength={160} autoComplete="name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}

            {mode !== "reset-password" && (
              <Field id="auth-email" label="Email address" icon={<Mail />} placeholder="you@example.com"
                required type="email" maxLength={254} autoComplete="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            )}

            {mode === "register" && (
              <Field id="auth-phone" label="Phone number" icon={<Phone />} placeholder="+250 7xx xxx xxx"
                required type="tel" minLength={5} maxLength={40} autoComplete="tel"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            )}

            {mode === "reset-password" && !tokenFromUrl && (
              <Field id="auth-token" label="Reset token" icon={<KeyRound />} placeholder="Paste the token from your email"
                required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
            )}

            {needsPassword && (
              <div>
                <Field id="auth-password" label={mode === "reset-password" ? "New password" : "Password"} icon={<Lock />}
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

            {error && <p role="alert" className="auth-error rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <button type="submit" className={`${goldBtn} auth-submit`} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 motion-safe:animate-spin" /> Please wait…</> : <>{copy.cta} <ArrowUpRight className="h-4 w-4" /></>}
            </button>
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
    <div className="rounded-2xl bg-zinc-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <Icon className="h-4 w-4 text-zinc-400" />
        {title}
      </div>
      <div className="mt-2 space-y-0.5 text-sm leading-relaxed text-zinc-600">{children}</div>
    </div>
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
        <Link className="button-link" href="/login">Sign in <ArrowUpRight /></Link>
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

      {error && (
        <div role="alert" className={`${card} p-8 text-center`}>
          <h1 className="text-xl font-semibold text-zinc-900">We couldn’t load this order</h1>
          <p className="mt-2 text-sm text-rose-600">{error}</p>
          <Link href="/orders" className={`${ghostBtn} mt-6 !w-auto`}>Back to my orders</Link>
        </div>
      )}

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
                <a href={order.paymentUrl} className={`${goldBtn} !w-auto shrink-0`}>
                  Complete payment <ArrowUpRight className="h-4 w-4" />
                </a>
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
              <ul className="mt-4 divide-y divide-zinc-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ${focusRing}`}
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center"><PackageOpen className="h-6 w-6 text-zinc-300" /></span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-zinc-900">{item.title}</p>
                      {item.artistName && <p className="mt-0.5 truncate text-sm text-zinc-500">{item.artistName}</p>}
                      <p className="mt-1 text-sm text-zinc-500">{money(item.unitPrice)} × {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-[15px] font-medium tabular-nums text-zinc-900">{money(Number(item.unitPrice) * item.quantity)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 flex flex-col items-center rounded-2xl bg-zinc-50 py-10 text-center">
                <PackageOpen className="h-8 w-8 text-zinc-400" />
                <p className="mt-3 text-sm text-zinc-500">No items are listed on this order.</p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between rounded-2xl bg-zinc-900 px-5 py-4">
              <span className="text-sm text-zinc-300">Total</span>
              <span className="text-xl font-semibold tabular-nums tracking-tight text-[#d4af37]">{money(order.total)}</span>
            </div>
          </section>

          <section className="grid gap-3 px-6 pb-8 pt-6 sm:grid-cols-2 sm:px-10" aria-label="Order details">
            <DetailBlock icon={User} title="Customer">
              <p>{order.customerName}</p>
              <p className="break-all">{order.customerEmail}</p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
            </DetailBlock>

            <DetailBlock icon={MapPin} title="Shipping to">
              {addr?.address && <p>{addr.address}</p>}
              {cityLine && <p>{cityLine}</p>}
              {addr?.country && <p>{addr.country}</p>}
            </DetailBlock>

            <div className="sm:col-span-2">
              <DetailBlock icon={order.paymentMethod === "mobile_money" ? Smartphone : CreditCard} title="Payment">
                <p>{pretty(order.paymentMethod)}{order.paymentProvider ? ` via ${order.paymentProvider}` : ""}</p>
                {order.paymentPhone && <p>Paid from {order.paymentPhone}</p>}
              </DetailBlock>
            </div>
          </section>

          {!!order.paymentAttempts?.length && (
            <section className="border-t border-zinc-100 px-6 pb-8 pt-6 sm:px-10" aria-labelledby="attempts-heading">
              <h2 id="attempts-heading" className="text-base font-semibold text-zinc-900">Payment attempts</h2>
              <ul className="mt-3 space-y-2">
                {order.paymentAttempts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-zinc-700">{a.reference}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{formatDate(a.createdAt)}</p>
                    </div>
                    <StatusBadge value={a.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}
    </Shell>
  );
}