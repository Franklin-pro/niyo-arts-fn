"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Button, Card, Descriptions, Empty, Image, Space, Tag, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined, PictureOutlined, UserOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { toAdminRows, formatAdminDate, formatAdminPrice } from "@/lib/admin-utils";
import type { AdminRecord } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

function text(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function imageUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function artistRecord(value: unknown): AdminRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AdminRecord;
}

function detailValue(key: string, value: unknown, currency: unknown) {
  if (["createdAt", "updatedAt", "uploadedAt"].includes(key)) return formatAdminDate(value);
  if (key === "price") return formatAdminPrice(value, currency);
  if (key === "imageUrl" && typeof value === "string") {
    return <a href={value} target="_blank" rel="noreferrer">Open image in new tab</a>;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value);
  return text(value);
}

export function ProductDetail({ slug }: { slug: string }) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const { data: product, error, loading } = useAdminResource(
    () => adminApi.products.list().then(({ data: products }) =>
      toAdminRows(products).find((item) => item.slug === slug) ?? null),
    [slug],
  );

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Artwork details" action={<Link href="/admin/products"><Button icon={<ArrowLeftOutlined />}>Back to products</Button></Link>} />
        <Card loading aria-label="Loading artwork details" />
      </>
    );
  }

  const artist = artistRecord(product?.artist);
  const productImage = imageUrl(product?.imageUrl);
  const artistImage = imageUrl(artist?.imageUrl);
  const artistId = text(product?.artistId || artist?.id, "");
  const hiddenFields = new Set([
    "artist", "artistId", "imageUrl", "title", "slug", "type", "category",
    "price", "currency", "description",
  ]);
  const extraDetails = Object.entries(product ?? {})
    .filter(([key, value]) => !hiddenFields.has(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (letter) => letter.toUpperCase()),
      children: detailValue(key, value, product?.currency),
    }));
  const artistDetails = artist
    ? Object.entries(artist)
      .filter(([key, value]) => !["imageUrl"].includes(key) && value !== null && value !== undefined && value !== "")
      .map(([key, value]) => ({
        key,
        label: key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (letter) => letter.toUpperCase()),
        children: detailValue(key, value, undefined),
      }))
    : [];

  return (
    <>
      <AdminPageHeader
        title={text(product?.title, "Artwork details")}
        action={
          <Space>
            <Link href="/admin/products"><Button icon={<ArrowLeftOutlined />}>Back to artworks</Button></Link>
            <Link href={`/admin/products/${encodeURIComponent(slug)}/edit`}><Button type="primary" icon={<EditOutlined />}>Edit artwork</Button></Link>
          </Space>
        }
      />
      <AdminFeedback error={error} />
      {product ? (
        <div className="adm-product-detail">
          <Card className="adm-antd-card adm-product-showcase" variant="borderless">
            <div className="adm-product-showcase-image">
              {productImage && failedImageUrl !== productImage ? (
                <Image
                  src={productImage}
                  alt={text(product.title, "Artwork")}
                  preview
                  onError={() => setFailedImageUrl(productImage)}
                />
              ) : (
                <Empty
                  image={<PictureOutlined />}
                  description={productImage ? "Artwork image could not be loaded" : "No artwork image provided"}
                />
              )}
            </div>
            <div className="adm-product-showcase-info">
              <Space wrap>
                {product.category !== null && product.category !== undefined && product.category !== "" && <Tag color="gold">{String(product.category)}</Tag>}
                {product.type !== null && product.type !== undefined && product.type !== "" && <Tag>{String(product.type)}</Tag>}
              </Space>
              <Typography.Title level={2}>{text(product.title, "Untitled artwork")}</Typography.Title>
              <Typography.Title level={3} className="adm-product-showcase-price">
                {formatAdminPrice(product.price, product.currency)}
              </Typography.Title>
              <Typography.Paragraph className="adm-product-description">
                {text(product.description, "No description provided.")}
              </Typography.Paragraph>
              {artist ? (
                <div className="adm-product-artist-summary">
                  <Avatar src={artistImage} icon={<UserOutlined />} size={48} />
                  <div>
                    <Typography.Text type="secondary">Created by</Typography.Text>
                    <Typography.Title level={5}>{text(artist.name, "Unknown artist")}</Typography.Title>
                    <Typography.Text type="secondary">
                      {[artist.medium, artist.location].filter(Boolean).map(String).join(" · ") || text(artist.slug)}
                    </Typography.Text>
                  </div>
                  {artist.slug && <Link href={`/admin/artists/${encodeURIComponent(String(artist.slug))}`}><Button type="link">View artist</Button></Link>}
                </div>
              ) : artistId ? (
                <div className="adm-product-artist-summary">
                  <Avatar icon={<UserOutlined />} size={48} />
                  <div><Typography.Text type="secondary">Artist</Typography.Text><Typography.Text strong>{artistId}</Typography.Text></div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      ) : !error ? <Empty description="Artwork not found" /> : null}
    </>
  );
}
