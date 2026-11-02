"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminArtistInput } from "@/services/api";

const EMPTY: AdminArtistInput = { slug: "", name: "", location: "", medium: "", bio: "", imageUrl: "" };

export function ArtistForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const { data: initial, error: loadError, loading } = useAdminResource(
    () => slug ? adminApi.artists.list().then(({ data }) => toAdminRows(data).find((row) => row.slug === slug) ?? null) : Promise.resolve(null),
    [slug],
  );
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!initial) return;
    setForm({
      slug: String(initial.slug || ""), name: String(initial.name || ""),
      location: String(initial.location || ""), medium: String(initial.medium || ""),
      bio: String(initial.bio || ""), imageUrl: String(initial.imageUrl || ""),
    });
  }, [initial]);
  const update = (field: keyof AdminArtistInput, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (slug) await adminApi.artists.update(slug, form);
      else await adminApi.artists.create(form);
      router.push("/admin/artists"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save artist."); }
    finally { setBusy(false); }
  };
  if (loading) return <p role="status">Loading artist…</p>;
  if (slug && loadError) return <AdminFeedback error={loadError} />;
  if (slug && !initial) return <p role="status">Artist not found.</p>;
  return <>
    <AdminPageHeader title={slug ? "Edit artist" : "New artist"} action={<Link href="/admin/artists" className="adm-link">Back to artists</Link>} />
    <AdminFeedback error={error} />
    <form className="adm-feature-form" onSubmit={save}>
      <label>Name<input required value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
      <label>Slug<input required value={form.slug} onChange={(e) => update("slug", e.target.value)} /></label>
      <label>Location<input required value={form.location} onChange={(e) => update("location", e.target.value)} /></label>
      <label>Medium<input required value={form.medium} onChange={(e) => update("medium", e.target.value)} /></label>
      <label>Image URL<input required type="url" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} /></label>
      <label className="adm-feature-form-wide">Bio<textarea required rows={5} value={form.bio} onChange={(e) => update("bio", e.target.value)} /></label>
      <div className="adm-feature-form-actions"><button className="button-link" disabled={busy}>{busy ? "Saving…" : "Save artist"}</button></div>
    </form>
  </>;
}
