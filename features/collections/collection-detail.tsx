"use client";

import Link from "next/link";
import { Button, Card, Empty, Image, Space, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { formatAdminPrice } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

export function CollectionDetail({ slug }: { slug: string }) {
  const { data: collection, error, loading } = useAdminResource(
    () => adminApi.collections.get(slug).then(({ data }) => data),
    [slug],
  );
  const products = Array.isArray(collection?.products) ? collection.products : [];

  return (
    <>
      <AdminPageHeader
        title={collection?.title || "Collection details"}
        action={
          <Space>
            <Link href="/admin/collections"><Button icon={<ArrowLeftOutlined />}>Back to collections</Button></Link>
            <Link href={`/admin/collections/${encodeURIComponent(slug)}/edit`}>
              <Button type="primary" icon={<EditOutlined />}>Edit collection</Button>
            </Link>
          </Space>
        }
      />
      <AdminFeedback error={error} />
      {loading ? (
        <Card loading aria-label="Loading collection details" />
      ) : collection ? (
        <div className="adm-collection-detail">
          <Card className="adm-antd-card adm-product-showcase" variant="borderless">
            <div className="adm-product-showcase-image">
              {collection.imageUrl ? (
                <Image src={collection.imageUrl} alt={collection.title} preview />
              ) : (
                <Empty image={<PictureOutlined />} description="No collection image provided" />
              )}
            </div>
            <div className="adm-product-showcase-info">
              <Typography.Text type="secondary">/{collection.slug}</Typography.Text>
              <Typography.Title level={2}>{collection.title}</Typography.Title>
              <Typography.Title level={4}>{collection.line}</Typography.Title>
              <Typography.Paragraph className="adm-product-description">
                {collection.description}
              </Typography.Paragraph>
            </div>
          </Card>

          <Card
            className="adm-antd-card"
            title={`Artwork in this collection (${products.length})`}
            variant="borderless"
          >
            {products.length ? (
              <div className="adm-collection-works">
                {products.map((product) => (
                  <Link
                    className="adm-collection-work"
                    href={`/admin/products/${encodeURIComponent(product.slug)}`}
                    key={product.slug}
                  >
                    <div className="adm-collection-work-image">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.title} preview={false} />
                      ) : (
                        <Empty image={<PictureOutlined />} description="No artwork image" />
                      )}
                    </div>
                    <Typography.Title level={5}>{product.title}</Typography.Title>
                    <Typography.Text type="secondary">{product.artist?.name || "Artist not specified"}</Typography.Text>
                    <Typography.Text strong>{formatAdminPrice(product.price, product.currency)}</Typography.Text>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty description="No artwork is linked to this collection" />
            )}
          </Card>
        </div>
      ) : !error ? (
        <Empty description="Collection not found" />
      ) : null}
    </>
  );
}
