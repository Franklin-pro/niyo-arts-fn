"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { slugFromTitle, toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminCollectionInput } from "@/services/api";

type CollectionFormValues = Omit<AdminCollectionInput, "productSlugs"> & { productSlugs: string };
const EMPTY: CollectionFormValues = { slug: "", title: "", line: "", description: "", imageUrl: "", productSlugs: "" };

export function CollectionForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const { data: initial, error: loadError, loading } = useAdminResource(
    () => slug ? adminApi.collections.list().then(({ data }) => toAdminRows(data).find((row) => row.slug === slug) ?? null) : Promise.resolve(null),
    [slug],
  );
  const [form, setForm] = useState(EMPTY);
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(!slug);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!initial) return;
    const products = Array.isArray(initial.productSlugs) ? initial.productSlugs
      : Array.isArray(initial.products) ? initial.products.flatMap((product) =>
        product && typeof product === "object" && "slug" in product ? [String(product.slug)] : [])
        : [];
    setForm({
      slug: String(initial.slug || ""), title: String(initial.title || ""),
      line: String(initial.line || ""), description: String(initial.description || ""),
      imageUrl: String(initial.imageUrl || ""), productSlugs: products.join(", "),
    });
  }, [initial]);
  const update = (field: keyof CollectionFormValues, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "title" && slugFollowsTitle ? { slug: slugFromTitle(value) } : {}),
    }));
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    const input: AdminCollectionInput = {
      ...form,
      productSlugs: form.productSlugs.split(",").map((productSlug) => productSlug.trim()).filter(Boolean),
    };
    try {
      if (slug) await adminApi.collections.update(slug, input);
      else await adminApi.collections.create(input);
      router.push("/admin/collections"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save collection."); }
    finally { setBusy(false); }
  };
  if (loading) return <p role="status">Loading collection…</p>;
  if (slug && loadError) return <AdminFeedback error={loadError} />;
  if (slug && !initial) return <p role="status">Collection not found.</p>;
  return <>
    <AdminPageHeader title={slug ? "Edit collection" : "New collection"} action={<Link href="/admin/collections" className="adm-link">Back to collections</Link>} />
    <AdminFeedback error={error} />
    <form className="adm-feature-form" onSubmit={save}>
      <label>Title<input required value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
      <label>Slug<input required value={form.slug} onChange={(e) => { setSlugFollowsTitle(false); update("slug", e.target.value); }} /></label>
      <label>Line<input required value={form.line} onChange={(e) => update("line", e.target.value)} /></label>
      <label>Image URL<input required type="url" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} /></label>
      <label className="adm-feature-form-wide">Description<textarea required rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
      <label className="adm-feature-form-wide">Product slugs<input value={form.productSlugs} onChange={(e) => update("productSlugs", e.target.value)} placeholder="blue-vase, woven-basket" /><small>Separate active product slugs with commas.</small></label>
      <div className="adm-feature-form-actions"><button className="button-link" disabled={busy}>{busy ? "Saving…" : "Save collection"}</button></div>
    </form>
  </>;
}
