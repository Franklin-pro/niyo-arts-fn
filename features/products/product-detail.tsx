"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Button, Card, Descriptions, Empty, Image, Space, Tag, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined, PictureOutlined, UserOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows, formatAdminDate, formatAdminPrice } from "@/lib/admin-utils";
import type { AdminRecord } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

const EMPTY = "—";

function text(value: unknown, fallback = EMPTY) {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function imageUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asRecord(value: unknown): AdminRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AdminRecord;
}

function humanize(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const LABELS: Record<string, string> = {
  id: "Artwork ID",
  slug: "URL slug",
  kind: "Kind",
  type: "Type",
  category: "Category",
  price: "Price",
  currency: "Currency",
  createdAt: "Created",
  updatedAt: "Last updated",
};

// Shown first, in this order. Anything else on the record is appended after.
const INFO_ORDER = ["id", "slug", "kind", "type", "category", "price", "currency", "createdAt", "updatedAt"];
// Already shown elsewhere on the page.
const HIDDEN = new Set(["artist", "artistId", "imageUrl", "images", "title", "description"]);

function detailValue(key: string, value: unknown, currency: unknown) {
  if (["createdAt", "updatedAt", "uploadedAt"].includes(key)) return formatAdminDate(value);
  if (key === "price") return formatAdminPrice(value, currency);
  if (key === "id" || key === "slug") {
    return <Typography.Text copyable code>{String(value)}</Typography.Text>;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return <code>{JSON.stringify(value)}</code>;
  if (key === "kind" || key === "currency") return String(value);
  return text(value);
}

type ImageView = { key: string; label: string; src: string };

export function ProductDetail({ slug }: { slug: string }) {
  const [activeKey, setActiveKey] = useState("front");
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const { data: product, error, loading } = useAdminResource(
    () => adminApi.products.list().then(({ data: products }) =>
      toAdminRows(products).find((item) => item.slug === slug) ?? null),
    [slug],
  );

  const backButton = (
    <Link href="/admin/products"><Button icon={<ArrowLeftOutlined />}>Back to artworks</Button></Link>
  );

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Artwork details" action={backButton} />
        <Card loading aria-label="Loading artwork details" />
      </>
    );
  }

  const artist = asRecord(product?.artist);
  const artistId = text(product?.artistId || artist?.id, "");
  const artistImage = imageUrl(artist?.imageUrl);
  const mainImage = imageUrl(product?.imageUrl);
  const imageSet = asRecord(product?.images);

  const views: ImageView[] = [
    { key: "front", label: "Front", src: imageUrl(imageSet?.front) || mainImage },
    { key: "right", label: "Right", src: imageUrl(imageSet?.right) },
    { key: "left", label: "Left", src: imageUrl(imageSet?.left) },
  ].filter((view): view is ImageView => Boolean(view.src));

  const activeView = views.find((view) => view.key === activeKey) ?? views[0];
  const activeFailed = activeView ? failedUrls.includes(activeView.src) : false;

  const record = (product ?? {}) as AdminRecord;
  const infoKeys = [
    ...INFO_ORDER.filter((key) => hasValue(record[key])),
    ...Object.keys(record).filter((key) => !INFO_ORDER.includes(key) && !HIDDEN.has(key) && hasValue(record[key])),
  ];
  const infoItems = infoKeys.map((key) => ({
    key,
    label: LABELS[key] ?? humanize(key),
    children: detailValue(key, record[key], record.currency),
  }));

  const artistMeta = artist
    ? [artist.medium, artist.location].filter(hasValue).map(String).join(" · ")
    : "";

  return (
    <>
      <AdminPageHeader
        title={text(product?.title, "Artwork details")}
        action={
          <Space wrap>
            {backButton}
            <Link href={`/admin/products/${encodeURIComponent(slug)}/edit`}>
              <Button type="primary" icon={<EditOutlined />}>Edit artwork</Button>
            </Link>
          </Space>
        }
      />
      <AdminFeedback error={error} />

      {product ? (
        <div className="adm-pd">
          {/* ---------- Overview: images + the essentials ---------- */}
          <Card className="adm-antd-card adm-pd-overview" variant="borderless">
            <section className="adm-pd-gallery" aria-label="Artwork images">
              <div className="adm-pd-stage">
                {activeView && !activeFailed ? (
                  <Image
                    key={activeView.src}
                    src={activeView.src}
                    alt={`${text(product.title, "Artwork")} – ${activeView.label.toLowerCase()} view`}
                    preview
                    onError={() => setFailedUrls((urls) => [...urls, activeView.src])}
                  />
                ) : (
                  <Empty
                    image={<PictureOutlined />}
                    description={activeView ? "This image could not be loaded" : "No image uploaded yet"}
                  />
                )}
              </div>

              {views.length > 1 && (
                <div className="adm-pd-thumbs" role="tablist" aria-label="Choose image view">
                  {views.map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      role="tab"
                      aria-selected={view.key === activeView?.key}
                      className="adm-pd-thumb"
                      onClick={() => setActiveKey(view.key)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={view.src} alt="" />
                      <span>{view.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeView && (
                <a className="adm-pd-open" href={activeView.src} target="_blank" rel="noreferrer">
                  Open full-size image
                </a>
              )}
            </section>

            <section className="adm-pd-summary">
              <Space size={[6, 6]} wrap>
                {hasValue(product.category) && <Tag color="gold">{String(product.category)}</Tag>}
                {hasValue(product.type) && <Tag>{String(product.type)}</Tag>}
                {hasValue(product.kind) && <Tag color="blue">{humanize(String(product.kind))}</Tag>}
              </Space>

              <Typography.Title level={2} className="adm-pd-title">
                {text(product.title, "Untitled artwork")}
              </Typography.Title>

              <div className="adm-pd-price">
                <span>Price</span>
                <strong>{formatAdminPrice(product.price, product.currency)}</strong>
              </div>

              <div className="adm-pd-block">
                <h3>Description</h3>
                <Typography.Paragraph className="adm-product-description">
                  {text(product.description, "No description provided.")}
                </Typography.Paragraph>
              </div>

              {(artist || artistId) && (
                <div className="adm-pd-block">
                  <h3>Artist</h3>
                  <div className="adm-pd-artist">
                    <Avatar src={artistImage} icon={<UserOutlined />} size={52} />
                    <div className="adm-pd-artist-text">
                      <strong>{artist ? text(artist.name, "Unknown artist") : artistId}</strong>
                      {artistMeta && <span>{artistMeta}</span>}
                    </div>
                    {artist?.slug && (
                      <Link href={`/admin/artists/${encodeURIComponent(String(artist.slug))}`}>
                        <Button>View artist</Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </section>
          </Card>

          {/* ---------- Full record ---------- */}
          <Card className="adm-antd-card" variant="borderless" title="Artwork information">
            <Descriptions
              bordered
              size="middle"
              column={{ xs: 1, sm: 1, md: 2 }}
              items={infoItems}
              styles={{ label: { width: "11rem" } }}
            />
          </Card>
        </div>
      ) : !error ? (
        <Empty description="Artwork not found" />
      ) : null}
    </>
  );
}