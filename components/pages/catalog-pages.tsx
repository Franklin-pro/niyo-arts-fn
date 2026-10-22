"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronDown, Heart, Search, SlidersHorizontal } from "lucide-react";
import { getArtist, getArtists, getCollection, getCollections, getProduct, getProducts } from "@/services/api";
import type { ApiArtist, ApiCollection, ProductQuery } from "@/services/api";
import type { Product } from "./shared";
import { formatPrice, toArtist, toCollection, toProduct, useResource } from "./shared";

export function ProductCard({ p, onAdd, signedIn, adding, returnTo }: { p: Product; onAdd: (p: Product) => Promise<void>; signedIn: boolean; adding: boolean; returnTo: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className="art-card">
      <Link href={`/shop/${p.slug}`}>
        <div className="art-image">
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
          <button
            className={liked ? "liked" : ""}
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            aria-label="Add to wishlist"
            aria-pressed={liked}
          >
            <Heart />
          </button>
        </div>
        <p className="art-type">{p.type}</p>
        <div className="art-meta">
          <div>
            <h3>{p.title}</h3>
            <p>{p.artist}</p>
          </div>
          <strong>{formatPrice(p.price, p.currency)}</strong>
        </div>
      </Link>
      {signedIn ? (
        <button className="quick-add" disabled={adding} onClick={() => { void onAdd(p).catch(() => undefined); }}>
          {adding ? "Adding…" : "Add to cart"} <ArrowUpRight />
        </button>
      ) : (
        <Link className="quick-add" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
          Sign in to add <ArrowUpRight />
        </Link>
      )}
    </article>
  );
}
export function Listing({ mode = "shop", onAdd, signedIn, adding }: { mode?: string; onAdd: (p: Product) => Promise<void>; signedIn: boolean; adding: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
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
        setPageCount(Math.max(1, result.pagination.pages));
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
          <label className="search-field">
            <Search />
            <input maxLength={120} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search works or artists" />
          </label>
          <div className="filter-row">
            {["All", "Abstract", "Painting", "Digital", "Photography"].map((x) => (
              <button className={category === x ? "active" : ""} onClick={() => { setCategory(x); setPage(1); }} key={x}>
                {x}
              </button>
            ))}
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort artwork">
              <option>Featured</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </div>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        {loading ? (
          <p role="status">Loading artwork…</p>
        ) : products.length ? (
          <>
            <div className={`art-grid ${mode === "gallery" ? "gallery-masonry" : ""}`}>
              {products.map((p) => (
                <ProductCard key={p.slug} p={p} onAdd={onAdd} signedIn={signedIn} adding={adding} returnTo={`/${mode}`} />
              ))}
            </div>
            <nav className="art-pagination" aria-label="Artwork pages">
              <p>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} works
              </p>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
                  Previous
                </button>
                <span aria-current="page">Page {page} of {pageCount}</span>
                <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page">
                  Next
                </button>
              </div>
            </nav>
          </>
        ) : !error ? (
          <div className="empty-state">
            <SlidersHorizontal />
            <h2>No works found.</h2>
            <p>Try another search or remove a filter.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
export function ProductPage({ slug, onAdd, signedIn, adding }: { slug: string; onAdd: (p: Product) => Promise<void>; signedIn: boolean; adding: boolean }) {
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
        <Link className="text-link" href="/shop">Back to the shop <ArrowUpRight /></Link>
      </section>
    );
  return (
    <section className="product-page">
      <Link className="back-link" href="/shop">
        <ArrowLeft /> Back to shop
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
            by <Link href={`/artists/${p.artistSlug}`}>{p.artist}</Link>
          </p>
          <p className="product-price">
            {p.currency} {p.price.toLocaleString()}
          </p>
          <p className="product-description">
            {p.description}
          </p>
          {signedIn ? (
            <button className="button-link add-button" disabled={adding} onClick={() => { void onAdd(p).catch(() => undefined); }}>
              {adding ? "Adding…" : "Add to cart"} <ArrowUpRight />
            </button>
          ) : (
            <Link className="button-link add-button" href={`/login?returnTo=${encodeURIComponent(`/shop/${slug}`)}`}>
              Sign in to add to cart <ArrowUpRight />
            </Link>
          )}
          <div className="accordions">
            <details open>
              <summary>Details <ChevronDown /></summary>
              <p>{p.type} · Ships worldwide</p>
            </details>
            <details>
              <summary>Delivery & returns <ChevronDown /></summary>
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
                <Link className="text-link" href={`/collections/${c.slug}`}>
                  Shop the collection <ArrowUpRight />
                </Link>
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
