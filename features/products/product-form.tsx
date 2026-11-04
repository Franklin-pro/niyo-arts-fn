"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Select } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { CloudinaryImageUpload } from "@/components/admin/cloudinary-image-upload";
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
  const [form] = Form.useForm<AdminProductInput>();
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
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(!slug);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    form.setFieldsValue({
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
  }, [form, initial]);

  const save = async (values: AdminProductInput) => {
    setBusy(true);
    setError("");
    try {
      if (slug) await adminApi.products.update(slug, values);
      else await adminApi.products.create(values);
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
      <AdminPageHeader title={slug ? "Edit artwork" : "New artwork"} action={<Link className="adm-link" href="/admin/products"><ArrowLeftOutlined /> Back to artworks</Link>} />
      <AdminFeedback error={error || artistsError} />
      {artistsError && <Alert showIcon type="error" title={artistsError} />}
      <Form
        form={form}
        layout="vertical"
        className="adm-feature-form"
        initialValues={EMPTY}
        onFinish={save}
        onValuesChange={(changed, values) => {
          if (Object.hasOwn(changed, "slug")) setSlugFollowsTitle(false);
          if (Object.hasOwn(changed, "title") && slugFollowsTitle) form.setFieldValue("slug", slugFromTitle(values.title || ""));
          setError("");
        }}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true }, { max: 180 }]}><Input placeholder="Enter product title" /></Form.Item>
        <Form.Item name="slug" label="Slug" rules={[{ required: true }, { max: 180 }]}><Input placeholder="Enter product slug" /></Form.Item>
        <Form.Item name="artistId" label="Artist" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={[
              ...(artists ?? []).map((artist) => ({ value: String(artist.id), label: String(artist.name || artist.slug) })),
              ...(form.getFieldValue("artistId") && !(artists ?? []).some((artist) => String(artist.id) === form.getFieldValue("artistId"))
                ? [{ value: form.getFieldValue("artistId"), label: `${form.getFieldValue("artistId")} (unknown)` }]
                : []),
            ]}
            placeholder="Select an artist"
          />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}><Input placeholder="Enter product type" /></Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}><Input placeholder="Enter product category" /></Form.Item>
        <Form.Item name="price" label="Price" rules={[{ required: true, type: "number", min: 0 }]}><InputNumber min={0} precision={2} className="w-full" /></Form.Item>
        <Form.Item name="currency" label="Currency" rules={[{ required: true }]}><Input maxLength={3} placeholder="Enter currency code" /></Form.Item>
        <Form.Item name="imageUrl" label="Artwork image" className="adm-feature-form-wide" rules={[{ required: true, message: "Upload an artwork image." }, { type: "url", message: "The uploaded image URL is invalid." }]}>
          <CloudinaryImageUpload disabled={busy} onUploadingChange={setUploading} />
        </Form.Item>
        <Form.Item name="description" label="Description" className="adm-feature-form-wide" rules={[{ required: true }]}><Input.TextArea rows={5} placeholder="Enter product description" /></Form.Item>
        <Form.Item className="adm-feature-form-actions"><Button type="primary" htmlType="submit" loading={busy} disabled={uploading}>Save product</Button></Form.Item>
      </Form>
    </>
  );
}
