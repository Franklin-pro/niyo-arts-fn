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
  const [addPending, setAddPending] = useState(false);
  const { message } = App.useApp();
  const isAdding = adding || addPending;
  const handleAdd = async () => {
    if (isAdding) return;
    setAddPending(true);
    try {
      await onAdd(p);
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Unable to add this work to your cart.");
    } finally {
      setAddPending(false);
    }
  };
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
      <Button className="quick-add" type="primary" loading={isAdding} disabled={isAdding}
        onClick={() => { void handleAdd(); }}
        icon={!isAdding ? <ArrowUpOutlined /> : undefined}>
        {isAdding ? "Adding…" : "Add & checkout"}
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
          {/* <div className="filter-row">
            <Radio.Group value={category} optionType="button" buttonStyle="solid" options={["All", "Abstract", "Painting", "Digital", "Photography"].map((value) => ({ label: value, value }))}
              onChange={(event) => { setCategory(event.target.value); setPage(1); }} />
            <Select aria-label="Sort artwork" value={sort} onChange={(value) => { setSort(value); setPage(1); }}
              options={["Featured", "Price: low to high", "Price: high to low"].map((value) => ({ label: value, value }))} />
          </div> */}
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
// Replace the existing `ProductPage` function in your catalog file with this one.
// No new imports needed (uses Link, useState, Button, App, ArrowLeftOutlined, ArrowUpOutlined, DownOutlined already imported).

export function ProductPage({ slug, onAdd, adding }: { slug: string; onAdd: (p: Product) => Promise<void>; adding: boolean }) {
  const { message } = App.useApp();
  const [addPending, setAddPending] = useState(false);
  const [selectedImageView, setSelectedImageView] = useState("front");
  const { data: p, error, loading } = useResource(
    () => getProduct(slug).then((result) => toProduct(result.data)),
    [slug],
  );
  const isAdding = adding || addPending;
  const handleAdd = async () => {
    if (isAdding || !p) return;
    setAddPending(true);
    try {
      await onAdd(p);
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : "Unable to add this work to your cart.");
    } finally {
      setAddPending(false);
    }
  };

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

  const productImages = (p.images
    ? [
        { view: "front", label: "Front", src: p.images.front },
        { view: "right", label: "Right", src: p.images.right },
        { view: "left", label: "Left", src: p.images.left },
      ]
    : [{ view: "front", label: "Front", src: p.image }]
  ).filter((image) => image.src);
  const selectedImage = productImages.find((image) => image.view === selectedImageView) || productImages[0];

  return (
    <section className="product-page">
      <Link className="back-link" href="/shop">
        <ArrowLeftOutlined /> Back to shop
      </Link>

      <div className="product-layout">
        {/* ---------- Images ---------- */}
        <div className="product-gallery">
          <div className="product-stage">
            <img src={selectedImage.src} alt={`${p.title}, ${selectedImage.label.toLowerCase()} view`} />
          </div>
          {productImages.length > 1 && (
            <div className="product-gallery-views" role="group" aria-label="Artwork views">
              {productImages.map((image) => (
                <button
                  key={image.view}
                  type="button"
                  className={selectedImage.view === image.view ? "selected" : ""}
                  aria-label={`Show ${image.label.toLowerCase()} view`}
                  aria-pressed={selectedImage.view === image.view}
                  onClick={() => setSelectedImageView(image.view)}
                >
                  <img src={image.src} alt="" />
                  <span>{image.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div className="product-info">
          <p className="product-type">{p.type}</p>
          <h1>{p.title}</h1>
          <p className="artist-name">
            by {p.artistSlug ? <Link href={`/artists/${p.artistSlug}`}>{p.artist}</Link> : p.artist}
          </p>

          <p className="product-price">
            <span>{p.currency}</span> {p.price.toLocaleString()}
          </p>

          <div className="product-buy">
            <Button
              className="button-link add-button"
              type="primary"
              size="large"
              loading={isAdding}
              disabled={isAdding}
              onClick={() => { void handleAdd(); }}
              icon={!isAdding ? <ArrowUpOutlined /> : undefined}
            >
              {isAdding ? "Adding…" : "Add & checkout"}
            </Button>
            <p className="product-buy-note">Ships within 3–5 business days. Secure checkout.</p>
          </div>

          <div className="product-section">
            <h2>About this work</h2>
            <p className="product-description">{p.description || "No description provided."}</p>
          </div>

          <dl className="product-facts">
            <div><dt>Type</dt><dd>{p.type}</dd></div>
            <div>
              <dt>Artist</dt>
              <dd>{p.artistSlug ? <Link href={`/artists/${p.artistSlug}`}>{p.artist}</Link> : p.artist}</dd>
            </div>
            {p.size && <div><dt>Size</dt><dd>{p.size}</dd></div>}
            {productImages.length > 1 && (
              <div><dt>Views</dt><dd>{productImages.map((image) => image.label).join(", ")}</dd></div>
            )}
          </dl>

          <div className="accordions">
            <details open>
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
        <p className="section-kicker">Niyo Arts / Curated Works</p>
        <h1>{slug ? data?.[0]?.title || "Collection" : "Ways of seeing."}</h1>
        <p>Themed selections from across the gallery, curated to help you find work that fits the way you live.</p>
      </section>
      <section className="collections-page">
        {loading && <p role="status">Loading Curated Works…</p>}
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
                <Link className="text-link" href={`/collections/${c.slug}`}>Shop the Curated Works <ArrowUpOutlined /></Link>
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

  if (slug) {
    const artist = data?.[0];
    if (loading) {
      return <section className="artists-page"><p role="status">Loading artist…</p></section>;
    }
    if (error || !artist) {
      return (
        <section className="artists-page">
          {error ? <p className="field-error" role="alert">{error}</p> : <Empty description="Artist not found" />}
          <Link className="text-link" href="/artists"><ArrowLeftOutlined /> Back to artists</Link>
        </section>
      );
    }

    return (
      <>
        <section className="artist-profile-page">
          <Link className="back-link" href="/artists"><ArrowLeftOutlined /> Back to artists</Link>
          <div className="artist-profile-showcase">
            <div className="artist-profile-image">
              <img src={artist.image} alt={`${artist.name} portrait`} />
            </div>
            <div className="artist-profile-info">
              <span className="artist-profile-label">Artist profile</span>
              <h1>{artist.name}</h1>
              <div className="artist-profile-tags">
                {artist.medium && <span>{artist.medium}</span>}
                {artist.location && <span>{artist.location}</span>}
              </div>
              <p className="artist-profile-bio">{artist.bio || "No artist biography provided."}</p>
              <div className="artist-profile-stats">
                <div>
                  <span>Artworks</span>
                  <strong>{artist.workCount ?? artist.products.length}</strong>
                </div>
                {artist.startingPrice !== null && artist.startingPrice !== undefined && (
                  <div>
                    <span>Starting price</span>
                    <strong>{formatPrice(artist.startingPrice, "RWF")}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="artist-profile-works">
          <header>
            <p className="section-kicker">Selected work</p>
            <h2>Artworks by {artist.name}</h2>
          </header>
          {artist.products.length ? (
            <div className="artist-profile-work-grid">
              {artist.products.map((product) => (
                <Link key={product.slug} href={`/shop/${encodeURIComponent(product.slug)}`} className="artist-profile-work">
                  <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
                  <span>{product.title}</span>
                  <small>{formatPrice(product.price, product.currency)}</small>
                </Link>
              ))}
            </div>
          ) : (
            <Empty description="No artwork is currently linked to this artist." />
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / Artists</p>
        <h1>Meet the makers.</h1>
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
                <p className="artist-bio w-96 truncate">{a.bio}</p>
                <p className="artist-stats">
                  {a.workCount ?? works.length} {((a.workCount ?? works.length) === 1) ? "work" : "works"}
                  {a.startingPrice !== null && a.startingPrice !== undefined ? ` · from $${a.startingPrice.toLocaleString()}` : ""}
                </p>
                {/* {slug && <p className="w-32 truncate">{a.bio}</p>} */}
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
