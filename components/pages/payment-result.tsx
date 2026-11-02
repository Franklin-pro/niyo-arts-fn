"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  X,
  Minus,
  Clock,
  Copy,
  RefreshCw,
  ArrowRight,
  Home,
  ReceiptText,
} from "lucide-react";

const GOLD = "#d4af37";

// Normalise whatever the gateway sends back into four states
function normalizeStatus(raw:any) {
  const s = (raw || "").toLowerCase();
  if (["successful", "success", "completed", "paid"].includes(s)) return "success";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  if (["failed", "error", "declined"].includes(s)) return "failed";
  return "pending";
}

const STATES = {
  success: {
    Icon: Check,
    label: "Paid",
    title: "Payment received",
    message:
      "Thank you. Your order is confirmed and we're getting it ready.",
    ring: "ring-emerald-200",
    solid: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    Icon: Minus,
    label: "Cancelled",
    title: "Payment cancelled",
    message:
      "You left before paying. Nothing was charged, and your cart is still waiting.",
    ring: "ring-amber-200",
    solid: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  failed: {
    Icon: X,
    label: "Failed",
    title: "Payment didn't go through",
    message:
      "Your card or wallet wasn't charged. Check your details or try another payment method.",
    ring: "ring-rose-200",
    solid: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  pending: {
    Icon: Clock,
    label: "Pending",
    title: "Confirming your payment",
    message:
      "We're waiting on your payment provider. This usually takes under a minute.",
    ring: "ring-sky-200",
    solid: "bg-sky-500",
    soft: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
};

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const status = normalizeStatus(
    searchParams.get("status") || searchParams.get("payment")
  );
  const txRef = searchParams.get("tx_ref");
  const orderReference = searchParams.get("reference") || txRef;

  // NY-0C12EAC9BD-B954DB205DCD -> NY-0C12EAC9BD
  const baseOrderReference:any = txRef
    ? txRef.split("-").slice(0, 2).join("-")
    : orderReference;

  const s = STATES[status];
  const Icon = s.Icon;

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(baseOrderReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  const refresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:py-16 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Receipt */}
        <div
          className="relative rounded-3xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(24,24,27,0.25)]"
          role="status"
          aria-live="polite"
        >
          {/* Top: status */}
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="relative mx-auto mb-6 h-20 w-20">
              {status === "pending" && (
                <span className="absolute inset-0 rounded-full bg-sky-400/30 motion-safe:animate-ping" />
              )}
              <span
                className={`relative flex h-20 w-20 items-center justify-center rounded-full ring-8 ${s.ring} ${s.solid}`}
              >
                <Icon className="h-9 w-9 text-white" strokeWidth={2.5} />
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${s.soft}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
              {s.title}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-zinc-500">
              {s.message}
            </p>
          </div>

          {/* Perforated divider */}
          <div className="relative h-0">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-zinc-100" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-zinc-100" />
            <div className="mx-6 border-t-2 border-dashed border-zinc-200" />
          </div>

          {/* Bottom: reference + actions */}
          <div className="px-8 pb-8 pt-8">
            {baseOrderReference && (
              <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">Order reference</p>
                  <p className="mt-0.5 truncate font-mono text-base font-semibold text-zinc-900">
                    {baseOrderReference}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyReference}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {status === "pending" && (
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "motion-safe:animate-spin" : ""}`}
                  />
                  {refreshing ? "Checking…" : "Check payment status"}
                </button>
              )}

              {(status === "failed" || status === "cancelled") && (
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  style={{ backgroundColor: GOLD }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold text-zinc-900 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37]"
                >
                  Return to checkout
                </button>
              )}

              {status === "success" && (
                <button
                  type="button"
                  onClick={() => router.push("/orders")}
                  style={{ backgroundColor: GOLD }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37]"
                >
                  <ReceiptText className="h-4 w-4" />
                  View my orders
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {status !== "success" && (
                <button
                  type="button"
                  onClick={() => router.push("/orders")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37]"
                >
                  View my orders
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
              >
                <Home className="h-4 w-4" />
                Back to home
              </button>
            </div>
          </div>
        </div>

        {status === "pending" && (
          <p className="mt-5 text-center text-xs text-zinc-500">
            Already paid? Keep this reference in case you need support.
          </p>
        )}
      </div>
    </main>
  );
}

// useSearchParams must sit inside Suspense in the App Router, or `next build` fails
export default function PaymentResult() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-100" />}>
      <PaymentResultInner />
    </Suspense>
  );
}