"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Select, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { slugFromTitle, toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminProductInput, ProductImages, ProductImageFiles } from "@/services/api";

type ProductImageView = keyof ProductImages;
const PRODUCT_IMAGE_VIEWS: { key: ProductImageView; label: string }[] = [
  { key: "front", label: "Front view" },
  { key: "right", label: "Right view" },
  { key: "left", label: "Left view" },
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const EMPTY: AdminProductInput = {
  slug: "", title: "", artistId: "", type: "", category: "", price: 0,
  currency: "RWF", images: { front: "", right: "", left: "" }, size: "", description: "",
};

function getImages(value: unknown): Partial<ProductImages> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const images = value as Record<string, unknown>;
  return {
    ...(typeof images.front === "string" ? { front: images.front } : {}),
    ...(typeof images.right === "string" ? { right: images.right } : {}),
    ...(typeof images.left === "string" ? { left: images.left } : {}),
  };
}

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
  const [imageFiles, setImageFiles] = useState<Partial<ProductImageFiles>>({});
  const [imageFileLists, setImageFileLists] = useState<Record<ProductImageView, UploadFile[]>>({
    front: [],
    right: [],
    left: [],
  });

  useEffect(() => {
    if (!initial) return;
    const images = getImages(initial.images);
    const frontImage = images.front || String(initial.imageUrl || "");
    form.setFieldsValue({
      slug: String(initial.slug || ""),
      title: String(initial.title || ""),
      artistId: String(initial.artistId || ""),
      type: String(initial.type || ""),
      category: String(initial.category || ""),
      price: Number(initial.price) || 0,
      currency: String(initial.currency || "RWF"),
      images: {
        front: frontImage,
        right: images.right || "",
        left: images.left || "",
      },
      size: String(initial.size || ""),
      description: String(initial.description || ""),
    });
    const currentImages = { ...images, ...(frontImage ? { front: frontImage } : {}) };
    setImageFileLists({
      front: currentImages.front ? [{ uid: "current-front", name: "Current front view", status: "done", url: currentImages.front }] : [],
      right: currentImages.right ? [{ uid: "current-right", name: "Current right view", status: "done", url: currentImages.right }] : [],
      left: currentImages.left ? [{ uid: "current-left", name: "Current left view", status: "done", url: currentImages.left }] : [],
    });
  }, [form, initial]);

  const save = async (values: AdminProductInput) => {
    const hasSelectedImages = PRODUCT_IMAGE_VIEWS.some(({ key }) => imageFiles[key]);
    if (hasSelectedImages && PRODUCT_IMAGE_VIEWS.some(({ key }) => !imageFiles[key])) {
      setError("Select new front, right, and left images together; the upload API requires all three views.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      let input = values;
      if (hasSelectedImages) {
        const files = imageFiles as ProductImageFiles;
        setUploading(true);
        const { data } = await adminApi.products.uploadImages(files);
        setUploading(false);
        form.setFieldsValue({ images: data.images });
        input = {
          ...values,
          images: data.images,
        };
      } else {
        const existingImages = getImages(values.images);
        if (!slug && PRODUCT_IMAGE_VIEWS.some(({ key }) => !existingImages[key])) {
          setError("Upload front, right, and left images before saving the product.");
          return;
        }
        const { images: _images, ...productValues } = values;
        input = {
          ...productValues,
          ...(existingImages.front && existingImages.right && existingImages.left
            ? { images: existingImages as ProductImages }
            : {}),
        };
      }

      if (slug) await adminApi.products.update(slug, input);
      else await adminApi.products.create(input);
      router.push("/admin/products");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save product.");
    } finally {
      setUploading(false);
      setBusy(false);
    }
  };

  const beforeUpload = (view: ProductImageView): NonNullable<UploadProps["beforeUpload"]> =>
    (file) => {
      if (!file.type.startsWith("image/")) {
        setError("Choose image files for the artwork views.");
        return Upload.LIST_IGNORE;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Artwork images must be 10 MB or smaller.");
        return Upload.LIST_IGNORE;
      }
      setError("");
      setImageFiles((current) => ({ ...current, [view]: file }));
      return false;
    };

  const updateFileList = (view: ProductImageView, fileList: UploadFile[]) => {
    setImageFileLists((current) => ({ ...current, [view]: fileList }));
    if (!fileList.length) {
      setImageFiles((current) => {
        const next = { ...current };
        delete next[view];
        return next;
      });
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
        <Form.Item name={["images", "front"]} hidden><Input /></Form.Item>
        <Form.Item name={["images", "right"]} hidden><Input /></Form.Item>
        <Form.Item name={["images", "left"]} hidden><Input /></Form.Item>
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
        <Form.Item name="size" label="Size" extra="For example: 30 x 40 cm">
          <Input maxLength={120} placeholder="30 x 40 cm" />
        </Form.Item>
        <Form.Item label="Artwork images" className="adm-feature-form-wide">
          <div className="adm-product-image-uploads">
            {PRODUCT_IMAGE_VIEWS.map(({ key, label }) => (
              <div key={key}>
                <p>{label}</p>
                <Upload
                  accept="image/*"
                  maxCount={1}
                  listType="picture"
                  fileList={imageFileLists[key]}
                  disabled={busy}
                  beforeUpload={beforeUpload(key)}
                  onChange={({ fileList }) => updateFileList(key, fileList)}
                  onRemove={() => {
                    setImageFiles((current) => {
                      const next = { ...current };
                      delete next[key];
                      return next;
                    });
                    return true;
                  }}
                >
                  <Button icon={<InboxOutlined />}>Choose {label.toLowerCase()}</Button>
                </Upload>
              </div>
            ))}
          </div>
          <Alert
            type="info"
            showIcon
            title="New artwork requires all three views. To replace images, select a new front, right, and left image together."
            style={{ marginTop: 12 }}
          />
        </Form.Item>
        <Form.Item name="description" label="Description" className="adm-feature-form-wide" rules={[{ required: true }]}><Input.TextArea rows={5} placeholder="Enter product description" /></Form.Item>
        <Form.Item className="adm-feature-form-actions"><Button type="primary" htmlType="submit" loading={busy} disabled={uploading}>Save product</Button></Form.Item>
      </Form>
    </>
  );
}
