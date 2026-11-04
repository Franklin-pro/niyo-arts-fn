"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Button, Card, Descriptions, Empty, Image, Space, Tag, Typography } from "antd";
import { ArrowLeftOutlined, EnvironmentOutlined, EditOutlined, PictureOutlined, UserOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { formatAdminDate, formatAdminPrice, toAdminRows } from "@/lib/admin-utils";
import type { AdminRecord } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

function text(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function imageUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function displayField(key: string, value: unknown) {
  if (["createdAt", "updatedAt"].includes(key)) return formatAdminDate(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value);
  return text(value);
}

function fieldLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function ArtistDetail({ slug }: { slug: string }) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const { data: artist, error, loading } = useAdminResource(
    () => adminApi.artists.get(slug).then(({ data }) => toAdminRows([data])[0] ?? null),
    [slug],
  );

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Artist details" action={<Link href="/admin/artists"><Button icon={<ArrowLeftOutlined />}>Back to artists</Button></Link>} />
        <Card loading aria-label="Loading artist details" />
      </>
    );
  }

  const portrait = imageUrl(artist?.imageUrl);
  const products = Array.isArray(artist?.products)
    ? artist.products.filter((item): item is AdminRecord => Boolean(item) && typeof item === "object")
    : [];
  const hiddenFields = new Set(["id", "slug", "name", "location", "medium", "bio", "imageUrl", "products", "workCount", "startingPrice"]);
  const details = Object.entries(artist ?? {})
    .filter(([key, value]) => !hiddenFields.has(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      label: fieldLabel(key),
      children: displayField(key, value),
    }));
  const workCount = typeof artist?.workCount === "number" ? artist.workCount : products.length;

  return (
    <>
      <AdminPageHeader
        title={text(artist?.name, "Artist details")}
        action={
          <Space>
            <Link href="/admin/artists"><Button icon={<ArrowLeftOutlined />}>Back to artists</Button></Link>
            <Link href={`/admin/artists/${encodeURIComponent(slug)}/edit`}><Button type="primary" icon={<EditOutlined />}>Edit artist</Button></Link>
          </Space>
        }
      />
      <AdminFeedback error={error} />
      {artist ? (
        <div className="adm-artist-detail">
          <Card className="adm-antd-card adm-artist-showcase" variant="borderless">
            <div className="adm-artist-showcase-image">
              {portrait && failedImageUrl !== portrait ? (
                <Image
                  src={portrait}
                  alt={text(artist.name, "Artist portrait")}
                  preview
                  onError={() => setFailedImageUrl(portrait)}
                />
              ) : (
                <Empty
                  image={<UserOutlined />}
                  description={portrait ? "Artist image could not be loaded" : "No artist image provided"}
                />
              )}
            </div>
            <div className="adm-artist-showcase-info">
              <Tag color="gold">Artist profile</Tag>
              <Typography.Title level={2}>{text(artist.name, "Unnamed artist")}</Typography.Title>
              <Space wrap className="adm-artist-tags">
                {artist.medium !== null && artist.medium !== undefined && artist.medium !== "" && <Tag>{String(artist.medium)}</Tag>}
                {artist.location !== null && artist.location !== undefined && artist.location !== "" && <Tag icon={<EnvironmentOutlined />}>{String(artist.location)}</Tag>}
              </Space>
              <Typography.Paragraph className="adm-artist-bio">
                {text(artist.bio, "No artist biography provided.")}
              </Typography.Paragraph>
              <Typography.Text type="secondary">profile created {artist.createdAt ? formatAdminDate(artist.createdAt) : "—"}</Typography.Text>
              <div className="adm-artist-stats">
                <div><Typography.Text type="secondary">Artworks</Typography.Text><Typography.Title level={4}>{workCount}</Typography.Title></div>
                {artist.startingPrice !== null && artist.startingPrice !== undefined && (
                  <div><Typography.Text type="secondary">Starting price</Typography.Text><Typography.Title level={4}>{formatAdminPrice(artist.startingPrice, "RWF")}</Typography.Title></div>
                )}
              </div>
            </div>
          </Card>

          <Card title={`Artwork by ${text(artist.name, "this artist")}`} className="adm-antd-card">
            {products.length ? (
              <div className="adm-artist-works">
                {products.map((product, index) => {
                  const productImage = imageUrl(product.imageUrl);
                  const productSlug = text(product.slug, "");
                  const artwork = (
                    <Card
                      key={String(product.id || product.slug || index)}
                      hoverable
                      className="adm-artist-work-card"
                      cover={productImage
                        ? <img src={productImage} alt={text(product.title, "Artwork")} loading="lazy" />
                        : <div className="adm-artist-work-placeholder"><PictureOutlined /></div>}
                    >
                      <Typography.Text strong ellipsis>{text(product.title, "Untitled artwork")}</Typography.Text>
                      <Typography.Text type="secondary">{formatAdminPrice(product.price, product.currency)}</Typography.Text>
                    </Card>
                  );
                  return productSlug
                    ? <Link key={String(product.id || productSlug)} href={`/admin/products/${encodeURIComponent(productSlug)}`}>{artwork}</Link>
                    : artwork;
                })}
              </div>
            ) : (
              <Empty description="No artwork is currently linked to this artist." />
            )}
          </Card>
        </div>
      ) : !error ? <Empty description="Artist not found" /> : null}
    </>
  );
}
