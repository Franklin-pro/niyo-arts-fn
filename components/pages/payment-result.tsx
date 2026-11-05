"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Tag } from "antd";
import {
  ArrowRightOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  HomeOutlined,
  MinusOutlined,
  ProfileOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const GOLD = "#d4af37";
type PaymentStatus = "success" | "cancelled" | "failed" | "pending";

// Normalise whatever the gateway sends back into four states
function normalizeStatus(raw: string | null): PaymentStatus {
  const s = (raw ?? "").toLowerCase();
  if (["successful", "success", "completed", "paid"].includes(s)) return "success";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  if (["failed", "error", "declined"].includes(s)) return "failed";
  return "pending";
}

const STATES = {
  success: {
    Icon: CheckOutlined,
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
    Icon: MinusOutlined,
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
    Icon: CloseOutlined,
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
    Icon: ClockCircleOutlined,
    label: "Pending",
    title: "Confirming your payment",
    message:
      "We're waiting on your payment provider. This usually takes under a minute.",
    ring: "ring-sky-200",
    solid: "bg-sky-500",
    soft: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
} satisfies Record<PaymentStatus, { Icon: typeof CheckOutlined; label: string; title: string; message: string; ring: string; solid: string; soft: string; dot: string }>;

function PaymentResultInner() {
  const { message } = App.useApp();
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
  const baseOrderReference = txRef
    ? txRef.split("-").slice(0, 2).join("-")
    : orderReference;

  const s = STATES[status];
  const Icon = s.Icon;

  const copyReference = async () => {
    if (!baseOrderReference) {
      message.error("No order reference is available to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(baseOrderReference);
      setCopied(true);
      message.success("Order reference copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Unable to copy the order reference.");
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
                <Icon className="h-9 w-9 text-white" />
              </span>
            </div>

            <Tag color={status === "success" ? "success" : status === "failed" ? "error" : status === "cancelled" ? "warning" : "processing"}>
              {s.label}
            </Tag>

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
                <Button size="small" className="shrink-0" onClick={copyReference} icon={copied ? <CheckOutlined /> : <CopyOutlined />}>
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {status === "pending" && (
                <Button
                  type="primary"
                  onClick={refresh}
                  loading={refreshing}
                  block
                  icon={!refreshing ? <ReloadOutlined /> : undefined}
                >
                  {refreshing ? "Checking…" : "Check payment status"}
                </Button>
              )}

              {(status === "failed" || status === "cancelled") && (
                <Button
                  type="primary"
                  onClick={() => router.push("/checkout")}
                  block
                  style={{ backgroundColor: GOLD, borderColor: GOLD }}
                >
                  Return to checkout
                </Button>
              )}

              <Button
                type="text"
                onClick={() => router.push("/")}
                block
                icon={<HomeOutlined />}
              >
                Back to home
              </Button>
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