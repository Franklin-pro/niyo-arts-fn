"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { useAuth } from "@/components/site-provider";
import { ApiRequestError, getOrder, getOrders, requestPasswordReset, resetPassword } from "@/services/api";
import type { ApiOrder } from "@/services/api";
import { ArrowRight, ArrowUpRight, Check, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, Mail, Phone, User } from "lucide-react";
import { formatPrice, useResource } from "./shared";
import { Generic } from "./static-pages";

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

const step = (n: number) => ({ "--i": n }) as CSSProperties;

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

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  style?: CSSProperties;
};

function AuthField({ id, label, icon, trailing, style, ...input }: FieldProps) {
  return (
    <div className={`auth-field${trailing ? " has-trailing" : ""}`} style={style}>
      <input id={id} placeholder=" " {...input} />
      <label htmlFor={id}>{label}</label>
      <span className="auth-icon" aria-hidden="true">{icon}</span>
      {trailing}
    </div>
  );
}

function AuthArt({ title, text }: { title: string; text: string }) {
  return (
    <aside className="auth-art" aria-hidden="true">
      <div className="auth-stage">
        <div className="auth-frame frame-a"><i /></div>
        <div className="auth-frame frame-b"><i /></div>
        <div className="auth-frame frame-c"><i /></div>
      </div>
      <div className="auth-art-copy">
        <p>{title}</p>
        <span>{text}</span>
      </div>
    </aside>
  );
}

export function AccountPage({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { user, authLoading, login, register, logout } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", token: "" });
  const [error, setError] = useState("");
  const [errorTick, setErrorTick] = useState(0);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenFromUrl, setTokenFromUrl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: orders, error: ordersError, loading: ordersLoading } = useResource(
    () => mode === "account" && user ? getOrders().then(({ data }) => data) : Promise.resolve([] as ApiOrder[]),
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

  /* ---------------------------- Signed-in account ---------------------------- */
  if (mode === "account" && user) {
    const initials = user.name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    return (
      <section className="acct-page">
        <header className="acct-head">
          <div className="acct-avatar" aria-hidden="true">{initials}</div>
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        </header>

        <div className="acct-grid">
          <div className="acct-card">
            <h2>Profile</h2>
            <dl>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Phone</dt><dd>{user.phone || "—"}</dd></div>
              <div><dt>Account type</dt><dd className="acct-role">{user.role}</dd></div>
            </dl>
            <div className="acct-actions">
              <Link className="button-link" href="/orders">View all orders <ArrowUpRight /></Link>
              {user.role === "admin" && <Link className="button-link acct-ghost" href="/admin">Studio dashboard <ArrowUpRight /></Link>}
              <button className="acct-signout" type="button" onClick={logout}><LogOut /> Sign out</button>
            </div>
          </div>

          <div className="acct-card">
            <h2>Recent orders</h2>
            {ordersLoading && <p role="status" className="acct-muted">Loading orders…</p>}
            {ordersError && <p role="alert" className="auth-error">{ordersError}</p>}
            {orders?.length ? (
              <ul className="acct-orders">
                {orders.map((order) => (
                  <li key={order.reference}>
                    <Link href={`/orders/${encodeURIComponent(order.reference)}`}>
                      <span className="acct-order-ref">{order.reference}</span>
                      <span className="acct-chips">
                        <em>{order.status}</em>
                        <em data-paid={String(order.paymentStatus).toLowerCase() === "paid"}>{order.paymentStatus}</em>
                      </span>
                      <strong>{formatPrice(order.total, order.currency)}</strong>
                      <ArrowRight className="acct-arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : !ordersLoading && <p className="acct-muted">No orders yet. When you buy a work, it will show up here.</p>}
          </div>
        </div>
      </section>
    );
  }

  if (authLoading) {
    return (
      <section className="auth-page">
        <div className="auth-panel">
          <p className="auth-loading" role="status"><Loader2 /> Checking your account…</p>
        </div>
      </section>
    );
  }

  /* ------------------------------ Already signed in ------------------------------ */
  if (user || mode === "account") {
    return (
      <section className="auth-page">
        <AuthArt title={COPY.login.art} text={COPY.login.artSub} />
        <div className="auth-panel">
          <div className="auth-card">
            <h1 style={step(0)}>{user ? "You’re signed in" : "Sign in required"}</h1>
            <p className="auth-sub" style={step(1)}>
              {user ? `Signed in as ${user.email}.` : "Sign in to view your profile, cart and orders."}
            </p>
            <div className="auth-stack" style={step(2)}>
              {user
                ? <Link className="button-link auth-submit" href="/account">Go to your account <ArrowUpRight /></Link>
                : <>
                    <Link className="button-link auth-submit" href="/login">Sign in <ArrowUpRight /></Link>
                    <Link className="auth-link" href="/register">Create an account</Link>
                  </>}
            </div>
          </div>
        </div>
      </section>
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
      className="auth-toggle"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
    >
      {showPassword ? <EyeOff /> : <Eye />}
    </button>
  );

  let n = 2;

  return (
    <section className="auth-page" data-mode={mode}>
      <AuthArt title={copy.art} text={copy.artSub} />

      <div className="auth-panel">
        <div className="auth-card" key={done ? "done" : mode}>
          {done ? (
            <div className="auth-done" role="status">
              <span className="auth-done-mark"><Check /></span>
              <h1>{mode === "forgot-password" ? "Check your inbox" : "Password updated"}</h1>
              <p className="auth-sub">{message}</p>
              <Link className="button-link auth-submit" href="/login">
                {mode === "forgot-password" ? "Back to sign in" : "Sign in now"} <ArrowUpRight />
              </Link>
            </div>
          ) : (
            <>
              <h1 style={step(0)}>{copy.title}</h1>
              <p className="auth-sub" style={step(1)}>{copy.sub}</p>

              <form
                className="auth-form"
                onSubmit={async (event) => {
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
                    setError(reason instanceof ApiRequestError && reason.validationErrors.length
                      ? reason.validationErrors.map((item) => `${item.path}: ${item.message}`).join(" ")
                      : reason instanceof Error ? reason.message : "Unable to complete the account request.");
                    setErrorTick((tick) => tick + 1);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {mode === "register" && (
                  <AuthField
                    id="auth-name" label="Full name" icon={<User />} style={step(n++)}
                    required minLength={2} maxLength={160} autoComplete="name"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                )}

                {mode !== "reset-password" && (
                  <AuthField
                    id="auth-email" label="Email address" icon={<Mail />} style={step(n++)}
                    required type="email" maxLength={254} autoComplete="email"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                )}

                {mode === "register" && (
                  <AuthField
                    id="auth-phone" label="Phone number" icon={<Phone />} style={step(n++)}
                    required type="tel" minLength={5} maxLength={40} autoComplete="tel"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                )}

                {mode === "reset-password" && !tokenFromUrl && (
                  <AuthField
                    id="auth-token" label="Reset token" icon={<KeyRound />} style={step(n++)}
                    required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })}
                  />
                )}

                {needsPassword && (
                  <div style={step(n++)} className="auth-pw">
                    <AuthField
                      id="auth-password" label={mode === "reset-password" ? "New password" : "Password"} icon={<Lock />}
                      trailing={passwordToggle}
                      required minLength={8} maxLength={128} type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    {showStrength && (
                      <div className="auth-strength" data-score={score} aria-live="polite">
                        <div className="auth-strength-bars"><i /><i /><i /><i /></div>
                        <span>{LEVELS[score]}{score < 3 ? " · use 8+ characters with numbers and capitals" : ""}</span>
                      </div>
                    )}
                  </div>
                )}

                {mode === "login" && (
                  <Link className="auth-forgot" href="/forgot-password" style={step(n++)}>Forgot password?</Link>
                )}

                {error && <p key={errorTick} role="alert" className="auth-error">{error}</p>}

                <button type="submit" className="button-link auth-submit" disabled={submitting} style={step(n++)}>
                  {submitting ? <><Loader2 className="auth-spin" /> Please wait…</> : <>{copy.cta} <ArrowUpRight /></>}
                </button>
              </form>

              <p className="auth-switch" style={step(n++)}>
                {mode === "login" && <>New to Niyo? <Link href="/register">Create an account</Link></>}
                {mode === "register" && <>Already have an account? <Link href="/login">Sign in</Link></>}
                {(mode === "forgot-password" || mode === "reset-password") && <>Remembered it? <Link href="/login">Back to sign in</Link></>}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function OrderDetail({ reference }: { reference: string }) {
  const { user, authLoading } = useAuth();
  const { data: order, error, loading } = useResource(
    () => user ? getOrder(reference).then(({ data }) => data) : Promise.resolve(null),
    [reference, user?.id],
  );
  if (authLoading) return <p className="page-intro" role="status">Checking account…</p>;
  if (!user) return <Generic title="Sign in required" eyebrow="Niyo / order"><Link className="button-link" href="/login">Sign in <ArrowUpRight /></Link></Generic>;
  return (
    <section className="generic-page">
      <p className="section-kicker">Niyo / order</p>
      <h1>Order details</h1>
      <div className="generic-content">
        {loading && <p role="status">Loading order…</p>}
        {error && <p role="alert" className="field-error">{error}</p>}
        {order && (
          <>
            <h2>{order.reference}</h2>
            <p>{order.status} · Payment {order.paymentStatus}</p>
            <p>Total: {formatPrice(order.total, order.currency)}</p>
            {order.items?.map((item) => (
              <p key={item.productSlug}>{item.product?.title || item.productSlug} · Qty {item.quantity}</p>
            ))}
          </>
        )}
      </div>
    </section>
  );
}