"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { slugFromTitle, toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminProductInput } from "@/services/api";

const EMPTY: AdminProductInput = {
  slug: "", title: "", artistId: "", type: "", category: "", price: 0,
  currency: "RWF", imageUrl: "", description: "",
};

export function ProductForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const { data: initial, error: loadError, loading } = useAdminResource(
    () => slug
      ? adminApi.products.list().then(({ data }) => toAdminRows(data).find((row) => row.slug === slug) ?? null)
      : Promise.resolve(null),
    [slug],
  );
  const { data: artists, error: artistsError } = useAdminResource(
    () => adminApi.artists.list().then(({ data }) => toAdminRows(data)),
    [],
  );
  const [form, setForm] = useState<AdminProductInput>(EMPTY);
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(!slug);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setForm({
      slug: String(initial.slug || ""),
      title: String(initial.title || ""),
      artistId: String(initial.artistId || ""),
      type: String(initial.type || ""),
      category: String(initial.category || ""),
      price: Number(initial.price) || 0,
      currency: String(initial.currency || "RWF"),
      imageUrl: String(initial.imageUrl || ""),
      description: String(initial.description || ""),
    });
  }, [initial]);

  const update = (field: keyof AdminProductInput, value: string) => {
    setForm((current) => field === "price"
      ? { ...current, price: Number(value) }
      : {
        ...current,
        [field]: value,
        ...(field === "title" && slugFollowsTitle ? { slug: slugFromTitle(value) } : {}),
      });
    setError("");
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (slug) await adminApi.products.update(slug, form);
      else await adminApi.products.create(form);
      router.push("/admin/products");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p role="status">Loading product…</p>;
  if (slug && loadError) return <AdminFeedback error={loadError} />;
  if (slug && !initial) return <p role="status">Product not found.</p>;
  return (
    <>
      <AdminPageHeader title={slug ? "Edit product" : "New product"} action={<Link className="adm-link" href="/admin/products"><ArrowLeft /> Back to products</Link>} />
      <AdminFeedback error={error || artistsError} />
      <form className="adm-feature-form" onSubmit={save}>
        <label>Title<input required value={form.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label>Slug<input required value={form.slug} onChange={(event) => { setSlugFollowsTitle(false); update("slug", event.target.value); }} /></label>
        <label>Artist<select required value={form.artistId} onChange={(event) => update("artistId", event.target.value)}>
          <option value="">Select an artist…</option>
          {(artists ?? []).map((artist) => <option key={String(artist.id)} value={String(artist.id)}>{String(artist.name || artist.slug)}</option>)}
          {form.artistId && !(artists ?? []).some((artist) => String(artist.id) === form.artistId) && <option value={form.artistId}>{form.artistId} (unknown)</option>}
        </select></label>
        <label>Type<input required value={form.type} onChange={(event) => update("type", event.target.value)} /></label>
        <label>Category<input required value={form.category} onChange={(event) => update("category", event.target.value)} /></label>
        <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} /></label>
        <label>Currency<input required value={form.currency} onChange={(event) => update("currency", event.target.value)} /></label>
        <label>Image URL<input required type="url" value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} /></label>
        <label className="adm-feature-form-wide">Description<textarea required rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
        <div className="adm-feature-form-actions"><button className="button-link" disabled={busy}>{busy ? "Saving…" : "Save product"}</button></div>
      </form>
    </>
  );
}
