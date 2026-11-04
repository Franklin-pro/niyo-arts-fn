"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Form, Input } from "antd";
import { CloudinaryImageUpload } from "@/components/admin/cloudinary-image-upload";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { slugFromTitle } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminCollectionInput } from "@/services/api";

type CollectionFormValues = Omit<AdminCollectionInput, "productSlugs"> & { productSlugs: string };
const EMPTY: CollectionFormValues = { slug: "", title: "", line: "", description: "", imageUrl: "", productSlugs: "" };

export function CollectionForm({ slug }: { slug?: string }) {
  const router = useRouter();
  const [form] = Form.useForm<CollectionFormValues>();
  const { data: initial, error: loadError, loading } = useAdminResource(
    () => slug ? adminApi.collections.get(slug).then(({ data }) => data) : Promise.resolve(null),
    [slug],
  );
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(!slug);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!initial) return;
    const products = Array.isArray(initial.products) ? initial.products.map((product) => product.slug) : [];
    form.setFieldsValue({
      slug: String(initial.slug || ""), title: String(initial.title || ""),
      line: String(initial.line || ""), description: String(initial.description || ""),
      imageUrl: String(initial.imageUrl || ""), productSlugs: products.join(", "),
    });
  }, [form, initial]);
  const save = async (values: CollectionFormValues) => {
    setBusy(true); setError("");
    const input: AdminCollectionInput = {
      ...values,
      productSlugs: values.productSlugs.split(",").map((productSlug) => productSlug.trim()).filter(Boolean),
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
    <Form
      form={form}
      layout="vertical"
      className="adm-feature-form"
      initialValues={EMPTY}
      onFinish={save}
      onValuesChange={(changed, values) => {
        if (Object.hasOwn(changed, "slug")) setSlugFollowsTitle(false);
        if (Object.hasOwn(changed, "title") && slugFollowsTitle) form.setFieldValue("slug", slugFromTitle(values.title || ""));
      }}
    >
      <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input placeholder="Enter collection title" /></Form.Item>
      <Form.Item name="slug" label="Slug" rules={[{ required: true }]}><Input placeholder="Enter collection slug" /></Form.Item>
      <Form.Item name="line" label="Line" rules={[{ required: true }]}><Input placeholder="Enter collection line" /></Form.Item>
      <Form.Item name="imageUrl" label="Collection image" className="adm-feature-form-wide" rules={[{ required: true, message: "Upload a collection image." }, { type: "url", message: "The uploaded image URL is invalid." }]}>
        <CloudinaryImageUpload disabled={busy} onUploadingChange={setUploading} />
      </Form.Item>
      <Form.Item name="description" label="Description" className="adm-feature-form-wide" rules={[{ required: true }]}><Input.TextArea rows={5} placeholder="Enter collection description" /></Form.Item>
      <Form.Item name="productSlugs" label="Product slugs" className="adm-feature-form-wide" extra="Separate active product slugs with commas.">
        <Input placeholder="blue-vase, woven-basket" />
      </Form.Item>
      <Form.Item className="adm-feature-form-actions"><Button type="primary" htmlType="submit" loading={busy} disabled={uploading}>Save collection</Button></Form.Item>
    </Form>
  </>;
}
