"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, App, Button, Empty, Input, Pagination, Radio, Select, Spin } from "antd";
import {
  ArrowLeftOutlined, ArrowUpOutlined, ControlOutlined, DownOutlined, HeartOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getArtist, getArtists, getCollection, getCollections, getProduct, getProducts } from "@/services/api";
import type { ApiArtist, ApiCollection, ProductQuery } from "@/services/api";
import type { Product } from "./shared";
import { formatPrice, toArtist, toCollection, toProduct, useResource } from "./shared";

export function ProductCard({ p, onAdd, adding }: { p: Product; onAdd: (p: Product) => Promise<void>; adding: boolean }) {
  const [liked, setLiked] = useState(false);
  const { message } = App.useApp();
  return (
    <article className="art-card">
      <div className="art-image">
        <Link href={`/shop/${p.slug}`}>
          <img className="art-img-main" src={p.image} alt={p.title} loading="lazy" decoding="async" />
          {p.artistImage && (
            <img
              className="art-img-artist"
              src={p.artistImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          )}
          <span className="art-artist-overlay" aria-hidden="true">
            <small>Artwork by</small>
            <strong>{p.artist}</strong>
          </span>
        </Link>
        <Button
          type="text"
          className={liked ? "liked art-like-button" : "art-like-button"}
          onClick={() => setLiked(!liked)}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={liked}
          icon={<HeartOutlined />}
        />
      </div>
      <Link href={`/shop/${p.slug}`}>
        <p className="art-type">{p.type}</p>
        <div className="art-meta">
          <div>
            <h3>{p.title}</h3>
            <p>{p.artist}</p>
          </div>
          <strong>{formatPrice(p.price, p.currency)}</strong>
        </div>
      </Link>
      <Button className="quick-add" type="primary" loading={adding}
        onClick={() => { void onAdd(p).catch((reason: unknown) => message.error(reason instanceof Error ? reason.message : "Unable to add this work to your cart.")); }}
        icon={!adding ? <ArrowUpOutlined /> : undefined}>
        {adding ? "Adding…" : "Add & checkout"}
      </Button>
    </article>
  );
}
export function Listing({ mode = "shop", onAdd, adding }: { mode?: string; onAdd: (p: Product) => Promise<void>; adding: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    const queryParams: ProductQuery = {
      q: query || undefined,
      category: category === "All" ? undefined : category,
      sort: sort === "Price: low to high" ? "price_asc" : sort === "Price: high to low" ? "price_desc" : "featured",
      page,
      limit: pageSize,
    };
    getProducts(queryParams)
      .then((result) => {
        if (!current) return;
        setProducts(result.data.map(toProduct));
        setTotal(result.pagination.total);
      })
      .catch((reason: unknown) => {
        if (current) setError(reason instanceof Error ? reason.message : "Unable to load artwork.");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [query, category, sort, page]);

  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / {mode}</p>
        <h1>{mode === "gallery" ? "A living archive." : "Find something to live with."}</h1>
        <p>Explore original works, limited editions, and digital pieces from artists shaping how we see the world.</p>
      </section>
      <section className="listing">
        <div className="toolbar">
          <Input className="search-field antd-catalog-search" allowClear maxLength={120} prefix={<SearchOutlined />}
            value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search works or artists" />
          <div className="filter-row">
            <Radio.Group value={category} optionType="button" buttonStyle="solid" options={["All", "Abstract", "Painting", "Digital", "Photography"].map((value) => ({ label: value, value }))}
              onChange={(event) => { setCategory(event.target.value); setPage(1); }} />
            <Select aria-label="Sort artwork" value={sort} onChange={(value) => { setSort(value); setPage(1); }}
              options={["Featured", "Price: low to high", "Price: high to low"].map((value) => ({ label: value, value }))} />
          </div>
        </div>
        {error && <Alert showIcon type="error" title={error} />}
        {loading ? (
          <div role="status"><Spin /> Loading artwork…</div>
        ) : products.length ? (
          <>
            <div className={`art-grid ${mode === "gallery" ? "gallery-masonry" : ""}`}>
              {products.map((p) => (
                <ProductCard key={p.slug} p={p} onAdd={onAdd} adding={adding} />
              ))}
            </div>
            <div className="art-pagination" aria-label="Artwork pages">
              <p>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} works
              </p>
              <Pagination current={page} total={total} pageSize={pageSize} showSizeChanger={false} onChange={setPage} />
            </div>
          </>
        ) : !error ? (
          <div className="empty-state">
            <Empty image={<ControlOutlined />} description="No works found. Try another search or remove a filter." />
          </div>
        ) : null}
      </section>
    </>
  );
}
export function ProductPage({ slug, onAdd, adding }: { slug: string; onAdd: (p: Product) => Promise<void>; adding: boolean }) {
  const { message } = App.useApp();
  const { data: p, error, loading } = useResource(
    () => getProduct(slug).then((result) => toProduct(result.data)),
    [slug],
  );
  if (loading) return <p className="page-intro" role="status">Loading artwork…</p>;
  if (error || !p)
    return (
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / Artwork</p>
        <h1>Artwork unavailable.</h1>
        <p role="alert">{error || "This artwork could not be found."}</p>
        <Link className="text-link" href="/shop">Back to the shop <ArrowUpOutlined /></Link>
      </section>
    );
  return (
    <section className="product-page">
      <Link className="back-link" href="/shop">
        <ArrowLeftOutlined /> Back to shop
      </Link>
      <div className="product-layout">
        <div className="product-gallery">
          <img src={p.image} alt={p.title} />
          <img src={p.image} alt={`${p.title} detail`} />
        </div>
        <div className="product-info">
          <p className="section-kicker">{p.type}</p>
          <h1>{p.title}</h1>
          <p className="artist-name">
            by {p.artistSlug
              ? <Link href={`/artists/${p.artistSlug}`}>{p.artist}</Link>
              : p.artist}
          </p>
          <p className="product-price">
            {p.currency} {p.price.toLocaleString()}
          </p>
          <p className="product-description">
            {p.description}
          </p>
          <Button className="button-link add-button" type="primary" loading={adding}
            onClick={() => { void onAdd(p).catch((reason: unknown) => message.error(reason instanceof Error ? reason.message : "Unable to add this work to your cart.")); }}
            icon={!adding ? <ArrowUpOutlined /> : undefined}>
            {adding ? "Adding…" : "Add & checkout"}
          </Button>
          <div className="accordions">
            <details open>
              <summary>Details <DownOutlined /></summary>
              <p>{p.description}</p>
            </details>
            <details>
              <summary>Delivery & returns <DownOutlined /></summary>
              <p>Carefully packed and dispatched within 3–5 business days.</p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
export function Collections({ slug }: { slug?: string }) {
  const { data, error, loading } = useResource(
    async () => {
      if (slug) return [toCollection((await getCollection(slug)).data)];
      return (await getCollections()).data.map(toCollection);
    },
    [slug],
  );
  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / Collections</p>
        <h1>{slug ? data?.[0]?.title || "Collection" : "Ways of seeing."}</h1>
        <p>Themed selections from across the gallery, curated to help you find work that fits the way you live.</p>
      </section>
      <section className="collections-page">
        {loading && <p role="status">Loading collections…</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        {data?.map((c, i) => (
            <article className={`collection-row ${i % 2 ? "reverse" : ""}`} key={c.title}>
              <Link href={`/collections/${c.slug}`} className="collection-row-image">
                <img src={c.image} alt={c.title} loading="lazy" decoding="async" />
              </Link>
              <div className="collection-row-body">
                <p className="section-kicker">
                  {c.products.length} {c.products.length === 1 ? "work" : "works"}
                </p>
                <h2>{c.title}</h2>
                <p className="collection-line">{c.line}</p>
                <p className="collection-text">{c.text}</p>
                <div className="mini-works">
                  {c.products.map((w) => (
                    <Link href={`/shop/${w.slug}`} className="mini-work" key={w.slug}>
                      <img src={w.image} alt={w.title} loading="lazy" decoding="async" />
                      <span>{w.title}</span>
                      <small>{formatPrice(w.price, w.currency)}</small>
                    </Link>
                  ))}
                </div>
                <Link className="text-link" href={`/collections/${c.slug}`}>Shop the collection <ArrowUpOutlined /></Link>
              </div>
            </article>
        ))}
      </section>
    </>
  );
}
export function Artists({ slug }: { slug?: string }) {
  const { data, error, loading } = useResource(
    async () => {
      if (slug) return [toArtist((await getArtist(slug)).data)];
      return (await getArtists()).data.map(toArtist);
    },
    [slug],
  );
  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / Artists</p>
        <h1>{slug ? data?.[0]?.name || "Artist" : "Meet the makers."}</h1>
        <p>Painters, photographers and digital artists from across the world, each with a distinct way of seeing.</p>
      </section>
      <section className="artists-page">
        {loading && <p role="status">Loading artists…</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="artist-grid">
          {data?.map((a) => {
            const works = a.products;
            const latest = works[works.length - 1];
            return (
              <Link key={a.slug} href={`/artists/${a.slug}`} className="artist-card">
                <div className="artist-image">
                  <img className="artist-photo" src={a.image} alt={`Work by ${a.name}`} loading="lazy" decoding="async" />
                  {latest && (
                    <>
                      <img
                        className="artist-latest"
                        src={latest.image}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="artist-latest-label" aria-hidden="true">
                        <small>Latest work</small>
                        <strong>{latest.title}</strong>
                        <em>{formatPrice(latest.price, latest.currency)}</em>
                      </span>
                    </>
                  )}
                </div>
                <div className="artist-info">
                  <div>
                    <h3>{a.name}</h3>
                    <p className="artist-medium">{a.medium}</p>
                  </div>
                  <span className="artist-location">{a.location}</span>
                </div>
                <p className="artist-bio">{a.bio}</p>
                <p className="artist-stats">
                  {a.workCount ?? works.length} {((a.workCount ?? works.length) === 1) ? "work" : "works"}
                  {a.startingPrice !== null && a.startingPrice !== undefined ? ` · from $${a.startingPrice.toLocaleString()}` : ""}
                </p>
                {slug && <p>{a.bio}</p>}
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
