"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useAuth } from "@/components/site-provider";
import { adminApi, ApiRequestError } from "@/services/api";
import type { AdminArtistInput, AdminCollectionInput, AdminProductInput } from "@/services/api";
import {
  AlertCircle, ArrowUpRight, Braces, Check, Layers, LayoutDashboard, Loader2, Mail,
  Package, Palette, Pencil, Plus, Search, ShoppingBag, Trash2, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatPrice, useResource } from "./shared";
import { Generic } from "./static-pages";

type AdminSection = "products" | "artists" | "collections" | "orders" | "contacts";
type AdminRow = { slug?: string; reference?: string; id?: string; status?: string; [key: string]: unknown };

export function toAdminRows(records: object[]): AdminRow[] {
  return records.map((record) => {
    const row: AdminRow = {};
    Object.entries(record).forEach(([key, value]) => { row[key] = value; });
    return row;
  });
}

const SECTIONS: { key: AdminSection; label: string; singular: string; icon: LucideIcon; blurb: string; editable: boolean }[] = [
  { key: "products", label: "Products", singular: "product", icon: Package, blurb: "Works for sale", editable: true },
  { key: "artists", label: "Artists", singular: "artist", icon: Palette, blurb: "Artist profiles", editable: true },
  { key: "collections", label: "Collections", singular: "collection", icon: Layers, blurb: "Curated groups", editable: true },
  { key: "orders", label: "Orders", singular: "order", icon: ShoppingBag, blurb: "Customer orders", editable: false },
  { key: "contacts", label: "Messages", singular: "message", icon: Mail, blurb: "Contact form inbox", editable: false },
];

const TEMPLATES: Partial<Record<AdminSection, object>> = {
  artists: { slug: "", name: "", location: "", medium: "", bio: "", imageUrl: "" },
  collections: { slug: "", title: "", line: "", description: "", imageUrl: "", productSlugs: [] },
};

type ProductFormValues = Omit<AdminProductInput, "price"> & { price: string };

const EMPTY_PRODUCT: ProductFormValues = {
  slug: "",
  title: "",
  artistId: "",
  type: "",
  category: "",
  price: "",
  currency: "",
  imageUrl: "",
  description: "",
};

const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;
const MESSAGE_STATUSES = ["new", "read", "replied"] as const;

const step = (n: number) => ({ "--i": Math.min(n, 12) }) as CSSProperties;

function tone(value: string) {
  const v = value.toLowerCase();
  if (["delivered", "replied", "paid", "active"].includes(v)) return "good";
  if (["shipped", "read", "processing"].includes(v)) return "info";
  if (["cancelled", "failed", "refunded"].includes(v)) return "bad";
  if (["new", "pending", "unpaid"].includes(v)) return "warn";
  return "neutral";
}

function Chip({ value }: { value: string }) {
  if (!value) return null;
  return <span className="adm-chip" data-tone={tone(value)}>{value}</span>;
}

function amount(value: unknown, currency: unknown) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "";
  return formatPrice(Number(value), String(currency || ""));
}

function money(row: AdminRow) {
  return amount(row.total, row.currency);
}

const HIDDEN_FIELDS = new Set(["id", "artistId", "isActive"]);
const WIDE_FIELDS = new Set(["description", "bio", "message", "imageUrl"]);

function fieldLabel(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function FieldValue({ name, row }: { name: string; row: AdminRow }) {
  const value = row[name];
  if (value === null || value === undefined || value === "") return <span className="adm-dim">—</span>;
  if (name === "artist" && typeof value === "object" && !Array.isArray(value)) {
    const artist = value as Record<string, unknown>;
    const details = [artist.location, artist.medium].filter((item) => typeof item === "string" && item);
    return (
      <span className="adm-artist-details">
        <strong>{String(artist.name || "Artist")}</strong>
        {details.length > 0 && <span>{details.join(" · ")}</span>}
        {typeof artist.slug === "string" && <span className="adm-dim">/{artist.slug}</span>}
      </span>
    );
  }
  if (typeof value === "boolean") return <Chip value={value ? "yes" : "no"} />;
  if (name === "price" || name === "total") return <>{amount(value, row.currency) || String(value)}</>;
  if (/At$/.test(name) && !Number.isNaN(Date.parse(String(value)))) {
    return <>{new Date(String(value)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</>;
  }
  if (name === "imageUrl") {
    return (
      <a className="adm-image-link" href={String(value)} target="_blank" rel="noreferrer">
        <img src={String(value)} alt="" loading="lazy" />
        <span>Open image <ArrowUpRight /></span>
      </a>
    );
  }
  if (name === "status" || name === "fulfillmentStatus" || name === "paymentStatus") return <Chip value={String(value)} />;
  if (Array.isArray(value)) {
    return value.length
      ? <span className="adm-tags">{value.map((item, i) => <span className="adm-chip" key={i}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>)}</span>
      : <span className="adm-dim">None</span>;
  }
  if (typeof value === "object") return <code>{JSON.stringify(value)}</code>;
  return <>{String(value)}</>;
}

function Details({ row }: { row: AdminRow }) {
  const keys = Object.keys(row).filter((key) => !HIDDEN_FIELDS.has(key));
  const active = row.isActive;
  return (
    <div className="adm-details">
      {typeof active === "boolean" && (
        <p className="adm-details-state"><Chip value={active ? "active" : "inactive"} /></p>
      )}
      <dl>
        {keys.map((key) => (
          <div key={key} data-wide={WIDE_FIELDS.has(key)}>
            <dt>{fieldLabel(key)}</dt>
            <dd><FieldValue name={key} row={row} /></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function describe(row: AdminRow, section: AdminSection) {
  const text = (key: string) => (row[key] ? String(row[key]) : "");
  switch (section) {
    case "products":
      return { title: text("title") || text("slug"), meta: [text("category") || text("type"), amount(row.price, row.currency)], image: text("imageUrl") };
    case "artists":
      return { title: text("name") || text("slug"), meta: [text("medium"), text("location")], image: text("imageUrl") };
    case "collections":
      return { title: text("title") || text("slug"), meta: [text("line"), Array.isArray(row.productSlugs) ? `${row.productSlugs.length} works` : ""], image: text("imageUrl") };
    case "orders":
      return { title: text("reference") || text("id"), meta: [text("paymentStatus") ? `Payment ${text("paymentStatus")}` : "", money(row)], image: "" };
    default:
      return { title: text("name") || text("email") || text("id"), meta: [text("email"), text("message").slice(0, 80)], image: "" };
  }
}

function orderStatus(row: AdminRow) {
  return String(row.fulfillmentStatus || row.status || "");
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setValue(target); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function Stat({ section, count, hint, index }: { section: (typeof SECTIONS)[number]; count: number; hint: string; index: number }) {
  const shown = useCountUp(count);
  const Icon = section.icon;
  return (
    <Link href={`/admin/${section.key}`} className="adm-stat" style={step(index)}>
      <span className="adm-stat-icon"><Icon /></span>
      <strong>{shown}</strong>
      <span className="adm-stat-label">{section.label}</span>
      <small>{hint}</small>
      <ArrowUpRight className="adm-stat-arrow" />
    </Link>
  );
}

async function loadSection(section: AdminSection) {
  const response = section === "products" ? await adminApi.products.list()
    : section === "artists" ? await adminApi.artists.list()
      : section === "collections" ? await adminApi.collections.list()
        : section === "orders" ? await adminApi.orders.list()
          : await adminApi.contacts.list();
  return toAdminRows(response.data);
}

export function AdminPage({ section = "dashboard" }: { section?: string }) {
  const { user, authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<AdminRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [payload, setPayload] = useState("");
  const [productForm, setProductForm] = useState<ProductFormValues>(EMPTY_PRODUCT);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const adminSection = section as AdminSection;
  const meta = SECTIONS.find((item) => item.key === section);
  const validSection = Boolean(meta);
  const MetaIcon = meta?.icon ?? LayoutDashboard;
  const isAdmin = user?.role === "admin";

  const { data: rows, error: loadError, loading } = useResource(
    async () => (!validSection || !isAdmin ? ([] as AdminRow[]) : loadSection(adminSection)),
    [adminSection, validSection, refreshKey, user?.role],
  );
  const { data: overview, error: overviewError, loading: overviewLoading } = useResource(
    async () => {
      if (validSection || !isAdmin) return null;
      const lists = await Promise.all(SECTIONS.map((item) => loadSection(item.key)));
      return Object.fromEntries(SECTIONS.map((item, i) => [item.key, lists[i]])) as Record<AdminSection, AdminRow[]>;
    },
    [validSection, refreshKey, user?.role],
  );

  useEffect(() => { setQuery(""); setEditorOpen(false); setSelected(null); }, [section]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setEditorOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [editorOpen]);

  if (authLoading) return <p className="page-intro" role="status">Checking administrator access…</p>;
  if (!user) return <Generic title="Sign in required" eyebrow="Niyo / admin"><Link className="button-link" href="/login">Sign in <ArrowUpRight /></Link></Generic>;
  if (user.role !== "admin") return <Generic title="Access denied" eyebrow="Niyo / admin"><p>This area is restricted to administrator accounts.</p></Generic>;

  const displayName = (row: AdminRow) =>
    String(row.title || row.name || row.reference || row.slug || row.id || "Record");

  const openEditor = (row: AdminRow | null) => {
    setSelected(row);
    setError("");
    setNotice("");
    if (adminSection === "products") {
      setProductForm({
        slug: String(row?.slug || ""),
        title: String(row?.title || ""),
        artistId: String(row?.artistId || ""),
        type: String(row?.type || ""),
        category: String(row?.category || ""),
        price: row?.price === null || row?.price === undefined ? "" : String(row.price),
        currency: String(row?.currency || ""),
        imageUrl: String(row?.imageUrl || ""),
        description: String(row?.description || ""),
      });
    } else {
      setPayload(JSON.stringify(row ?? TEMPLATES[adminSection] ?? {}, null, 2));
    }
    setEditorOpen(true);
  };
  const closeEditor = () => { setEditorOpen(false); setSelected(null); setError(""); };

  const runAction = async (action: () => Promise<unknown>) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await action();
      setNotice("Changes saved.");
      setSelected(null);
      setPayload("");
      setEditorOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (reason) {
      setError(reason instanceof ApiRequestError && reason.validationErrors.length
        ? reason.validationErrors.map((item) => `${item.path}: ${item.message}`).join(" ")
        : reason instanceof Error ? reason.message : "The admin request failed.");
    } finally {
      setBusy(false);
    }
  };

  const parsePayload = (): Record<string, unknown> => {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Enter a JSON object.");
    }
    return value as Record<string, unknown>;
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adminSection === "products") {
      const input: AdminProductInput = { ...productForm, price: Number(productForm.price) };
      await runAction(() => selected?.slug
        ? adminApi.products.update(selected.slug, input)
        : adminApi.products.create(input));
      return;
    }

    try {
      const record = parsePayload();
      if (adminSection === "artists") {
        const input: AdminArtistInput = {
          slug: String(record.slug || ""),
          name: String(record.name || ""),
          location: String(record.location || ""),
          medium: String(record.medium || ""),
          bio: String(record.bio || ""),
          imageUrl: String(record.imageUrl || ""),
        };
        await runAction(() => selected?.slug
          ? adminApi.artists.update(selected.slug, input)
          : adminApi.artists.create(input));
      } else if (adminSection === "collections") {
        const input: AdminCollectionInput = {
          slug: String(record.slug || ""),
          title: String(record.title || ""),
          line: String(record.line || ""),
          description: String(record.description || ""),
          imageUrl: String(record.imageUrl || ""),
          productSlugs: Array.isArray(record.productSlugs) ? record.productSlugs.map(String) : [],
        };
        await runAction(() => selected?.slug
          ? adminApi.collections.update(selected.slug, input)
          : adminApi.collections.create(input));
      } else {
        throw new Error("Editing is not available for this section.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The JSON payload is invalid.");
    }
  };

  const removeRow = (row: AdminRow) => {
    if (!window.confirm(`Delete or deactivate "${displayName(row)}"?`)) return;
    void runAction(() => adminSection === "products" ? adminApi.products.remove(row.slug || "")
      : adminSection === "artists" ? adminApi.artists.remove(row.slug || "")
        : adminSection === "collections" ? adminApi.collections.remove(row.slug || "")
          : adminSection === "contacts" ? adminApi.contacts.remove(row.id || "")
            : Promise.reject(new Error("Orders cannot be deleted.")));
  };

  const json = (() => {
    if (!payload.trim()) return { ok: false, msg: "Payload is empty" };
    try {
      const value: unknown = JSON.parse(payload);
      if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, msg: "Must be a JSON object" };
      return { ok: true, msg: `Valid JSON · ${Object.keys(value).length} fields` };
    } catch (reason) {
      return { ok: false, msg: reason instanceof Error ? reason.message : "Invalid JSON" };
    }
  })();

  const updateProductField = (field: keyof ProductFormValues, value: string) => {
    setProductForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const filtered = (rows ?? []).filter((row) => !query.trim() || JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase()));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  return (
    <div className="adm">
      {/* ------------------------------- Sidebar ------------------------------- */}
      <aside className="adm-side">
        <p className="adm-side-title">Studio</p>
        <nav aria-label="Admin sections">
          <Link href="/admin" className="adm-nav" aria-current={!validSection ? "page" : undefined}>
            <LayoutDashboard /> <span>Overview</span>
          </Link>
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <Link href={`/admin/${key}`} className="adm-nav" key={key} aria-current={section === key ? "page" : undefined}>
              <Icon /> <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* -------------------------------- Main -------------------------------- */}
      <main className="adm-main">
        {!validSection ? (
          <>
            <header className="adm-head">
              <div>
                <h1>{greeting}, {firstName}</h1>
                <p>Here’s what’s happening in the gallery today.</p>
              </div>
            </header>
            {overviewError && <p role="alert" className="adm-alert"><AlertCircle /> {overviewError}</p>}
            {overviewLoading || !overview ? (
              <div className="adm-stats" aria-busy="true">
                {SECTIONS.map((item) => <div className="adm-skel adm-skel-stat" key={item.key} />)}
              </div>
            ) : (
              <>
                <div className="adm-stats">
                  {SECTIONS.map((item, index) => {
                    const list = overview[item.key];
                    const hint = item.key === "orders"
                      ? `${list.filter((row) => !["delivered", "cancelled"].includes(orderStatus(row).toLowerCase())).length} open`
                      : item.key === "contacts"
                        ? `${list.filter((row) => String(row.status || "new") === "new").length} new`
                        : item.blurb;
                    return <Stat key={item.key} section={item} count={list.length} hint={hint} index={index} />;
                  })}
                </div>

                <div className="adm-panels">
                  {(["orders", "contacts"] as const).map((key, panelIndex) => {
                    const item = SECTIONS.find((s) => s.key === key)!;
                    const list = overview[key].slice(0, 5);
                    return (
                      <section className="adm-panel" key={key} style={step(5 + panelIndex)}>
                        <header>
                          <h2>{key === "orders" ? "Latest orders" : "Latest messages"}</h2>
                          <Link href={`/admin/${key}`} className="adm-link">View all <ArrowUpRight /></Link>
                        </header>
                        {list.length ? (
                          <ul>
                            {list.map((row, i) => {
                              const d = describe(row, key);
                              const status = key === "orders" ? orderStatus(row) : String(row.status || "");
                              return (
                                <li key={row.reference || row.id || i}>
                                  <div><strong>{d.title}</strong><small>{d.meta.filter(Boolean).join(" · ")}</small></div>
                                  <Chip value={status} />
                                </li>
                              );
                            })}
                          </ul>
                        ) : <p className="adm-empty-inline">No {item.label.toLowerCase()} yet.</p>}
                      </section>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <header className="adm-head">
              <div>
                <h1>{meta!.label}</h1>
                <p>{loading ? "Loading…" : `${rows?.length ?? 0} ${rows?.length === 1 ? meta!.singular : meta!.singular + "s"}`}</p>
              </div>
              {meta!.editable && (
                <button className="button-link" type="button" onClick={() => openEditor(null)}>
                  <Plus /> New {meta!.singular}
                </button>
              )}
            </header>

            {(loadError || (error && !editorOpen)) && <p role="alert" className="adm-alert"><AlertCircle /> {loadError || error}</p>}

            <div className="adm-toolbar">
              <label className="adm-search">
                <Search />
                <input type="search" placeholder={`Search ${meta!.label.toLowerCase()}`} value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>

            {loading ? (
              <div className="adm-list" aria-busy="true">
                {[0, 1, 2, 3, 4].map((i) => <div className="adm-skel adm-skel-row" key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="adm-empty">
                <MetaIcon />
                <h2>{query ? "No matches" : `No ${meta!.label.toLowerCase()} yet`}</h2>
                <p>{query ? "Try a different search term." : meta!.editable ? `Create your first ${meta!.singular} to get started.` : "New entries will show up here."}</p>
                {!query && meta!.editable && <button className="button-link" type="button" onClick={() => openEditor(null)}><Plus /> New {meta!.singular}</button>}
              </div>
            ) : (
              <div className="adm-list">
                {filtered.map((row, index) => {
                  const d = describe(row, adminSection);
                  const key = row.slug || row.reference || row.id || displayName(row);
                  const Icon = MetaIcon;
                  const status = adminSection === "orders" ? orderStatus(row) : "";
                  return (
                    <article className="adm-row" key={key} style={step(index)}>
                      <div className="adm-thumb">{d.image ? <img src={d.image} alt="" loading="lazy" /> : <Icon />}</div>
                      <div className="adm-row-main">
                        <h3>{d.title}</h3>
                        <p>{d.meta.filter(Boolean).join(" · ")}</p>
                        <details>
                          <summary>Details</summary>
                          <Details row={row} />
                        </details>
                      </div>

                      <div className="adm-row-controls">
                        {adminSection === "orders" && (
                          <>
                            <Chip value={status} />
                            <select
                              key={`${key}-${status}`}
                              aria-label={`Fulfillment status for ${displayName(row)}`}
                              defaultValue={status}
                              disabled={busy}
                              onChange={(event) => {
                                if (!row.reference || !event.target.value) return;
                                void runAction(() => adminApi.orders.updateStatus(row.reference || "", event.target.value as "processing" | "shipped" | "delivered" | "cancelled"));
                              }}
                            >
                              {!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]) && <option value={status} disabled>{status || "Update fulfillment"}</option>}
                              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          </>
                        )}
                        {adminSection === "contacts" && (
                          <>
                            <Chip value={String(row.status || "new")} />
                            <select
                              key={`${key}-${row.status}`}
                              aria-label={`Message status for ${displayName(row)}`}
                              defaultValue={String(row.status || "new")}
                              disabled={busy}
                              onChange={(event) => {
                                if (!row.id) return;
                                void runAction(() => adminApi.contacts.updateStatus(row.id || "", event.target.value as "new" | "read" | "replied"));
                              }}
                            >
                              {MESSAGE_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                            </select>
                            <button type="button" className="adm-icon-btn danger" onClick={() => removeRow(row)} aria-label={`Delete ${displayName(row)}`}><Trash2 /></button>
                          </>
                        )}
                        {meta!.editable && (
                          <>
                            <button type="button" className="adm-icon-btn" onClick={() => openEditor(row)} aria-label={`Edit ${displayName(row)}`}><Pencil /></button>
                            <button type="button" className="adm-icon-btn danger" onClick={() => removeRow(row)} aria-label={`Delete ${displayName(row)}`}><Trash2 /></button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* -------------------------------- Editor -------------------------------- */}
      {editorOpen && meta && (
        <div className="adm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
          <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={`${selected?.slug ? "Edit" : "Create"} ${meta.singular}`}>
            <form onSubmit={saveRecord}>
              <header>
                <div>
                  <h2>{selected?.slug ? "Edit" : "New"} {meta.singular}</h2>
                  <p>
                    {adminSection === "products"
                      ? "Enter the product details below. Products need an artist ID."
                      : adminSection === "collections"
                        ? "Only fields accepted by the API are saved. Collection productSlugs must be active products."
                        : "Only fields accepted by the API are saved."}
                  </p>
                </div>
                <button type="button" className="adm-icon-btn" onClick={closeEditor} aria-label="Close editor"><X /></button>
              </header>

              <div className="adm-editor">
                {adminSection === "products" ? (
                  <div className="adm-product-fields">
                    <label>
                      Slug
                      <input required value={productForm.slug} onChange={(event) => updateProductField("slug", event.target.value)} />
                    </label>
                    <label>
                      Title
                      <input required value={productForm.title} onChange={(event) => updateProductField("title", event.target.value)} />
                    </label>
                    <label>
                      Artist ID
                      <input required value={productForm.artistId} onChange={(event) => updateProductField("artistId", event.target.value)} />
                    </label>
                    <label>
                      Type
                      <input required value={productForm.type} onChange={(event) => updateProductField("type", event.target.value)} />
                    </label>
                    <label>
                      Category
                      <input required value={productForm.category} onChange={(event) => updateProductField("category", event.target.value)} />
                    </label>
                    <label>
                      Price
                      <input required type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => updateProductField("price", event.target.value)} />
                    </label>
                    <label>
                      Currency
                      <input required value={productForm.currency} onChange={(event) => updateProductField("currency", event.target.value)} />
                    </label>
                    <label>
                      Image URL
                      <input required type="url" value={productForm.imageUrl} onChange={(event) => updateProductField("imageUrl", event.target.value)} />
                    </label>
                    <label className="adm-product-fields-wide">
                      Description
                      <textarea required rows={5} value={productForm.description} onChange={(event) => updateProductField("description", event.target.value)} />
                    </label>
                  </div>
                ) : (
                  <>
                    <textarea
                      rows={16}
                      spellCheck={false}
                      aria-label="Admin JSON payload"
                      aria-invalid={!json.ok}
                      value={payload}
                      onChange={(event) => { setPayload(event.target.value); setError(""); }}
                    />
                    <div className="adm-json-state" data-ok={json.ok}>
                      {json.ok ? <Check /> : <AlertCircle />}
                      <span>{json.msg}</span>
                      <button
                        type="button"
                        disabled={!json.ok}
                        onClick={() => setPayload(JSON.stringify(JSON.parse(payload), null, 2))}
                      ><Braces /> Format</button>
                    </div>
                  </>
                )}
                {error && <p role="alert" className="adm-alert"><AlertCircle /> {error}</p>}
              </div>

              <footer>
                <button className="adm-cancel" type="button" onClick={closeEditor}>Cancel</button>
                <button className="button-link" type="submit" disabled={busy || (adminSection !== "products" && !json.ok)}>
                  {busy ? <><Loader2 className="adm-spin" /> Saving…</> : <>Save changes</>}
                </button>
              </footer>
            </form>
          </aside>
        </div>
      )}

      {notice && <div className="adm-toast" role="status"><Check /> {notice}</div>}
    </div>
  );
}