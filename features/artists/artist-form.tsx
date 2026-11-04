"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Form, Input } from "antd";
import { CloudinaryImageUpload } from "@/components/admin/cloudinary-image-upload";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminArtistInput } from "@/services/api";

const EMPTY: AdminArtistInput = { slug: "", name: "", location: "", medium: "", bio: "", imageUrl: "" };

export function ArtistForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const [form] = Form.useForm<AdminArtistInput>();
  const { data: initial, error: loadError, loading } = useAdminResource(
    () => slug ? adminApi.artists.list().then(({ data }) => toAdminRows(data).find((row) => row.slug === slug) ?? null) : Promise.resolve(null),
    [slug],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    form.setFieldsValue({
      slug: String(initial.slug || ""), name: String(initial.name || ""),
      location: String(initial.location || ""), medium: String(initial.medium || ""),
      bio: String(initial.bio || ""), imageUrl: String(initial.imageUrl || ""),
    });
  }, [form, initial]);

  const save = async (values: AdminArtistInput) => {
    setBusy(true); setError("");
    try {
      if (slug) await adminApi.artists.update(slug, values);
      else await adminApi.artists.create(values);
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
    <Form form={form} layout="vertical" className="adm-feature-form" initialValues={EMPTY} onFinish={save}>
      <Form.Item name="name" label="Name" rules={[{ required: true }, { min: 2, max: 160 }]}><Input placeholder="Enter artist name"/></Form.Item>
      <Form.Item name="slug" label="Slug" rules={[{ required: true }, { max: 180 }]}><Input placeholder="Enter artist slug" /></Form.Item>
      <Form.Item name="location" label="Location" rules={[{ required: true }]}><Input placeholder="Enter artist location" /></Form.Item>
      <Form.Item name="medium" label="Medium" rules={[{ required: true }]}><Input placeholder="Enter artist medium" /></Form.Item>
      <Form.Item name="imageUrl" label="Portrait image" className="adm-feature-form-wide" rules={[{ required: true, message: "Upload a portrait image." }, { type: "url", message: "The uploaded image URL is invalid." }]}>
        <CloudinaryImageUpload disabled={busy} onUploadingChange={setUploading} />
      </Form.Item>
      <Form.Item name="bio" label="Bio" className="adm-feature-form-wide" rules={[{ required: true }]}><Input.TextArea rows={5} placeholder="Enter artist bio ..." /></Form.Item>
      <Form.Item className="adm-feature-form-actions"><Button type="primary" htmlType="submit" loading={busy} disabled={uploading}>Save artist</Button></Form.Item>
    </Form>
  </>;
}
