"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { getCollections, getProducts } from "@/services/api";
import { ProductCard } from "./catalog-pages";
import { image, toCollection, toProduct } from "./shared";
import type { Collection, Product } from "./shared";

export function HomePage({
  onAdd,
  signedIn,
  adding,
}: {
  onAdd: (product: Product) => Promise<void>;
  signedIn: boolean;
  adding: boolean;
}) {
  const [data, setData] = useState<{ products: Product[]; collections: Collection[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getProducts({ limit: 3 }), getCollections()])
      .then(([productResult, collectionResult]) => {
        if (!active) return;
        setData({
          products: productResult.data.map(toProduct),
          collections: collectionResult.data.map(toCollection),
        });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load home page artwork.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Niyo Arts / 01 — 2026</p>
          <h1>Discover art.<br /><em>Own a story.</em></h1>
          <p className="hero-description">
            A considered collection of original and limited edition artwork from the artists shaping how we see the world.
          </p>
          <Link className="circle-link" href="/shop" aria-label="Shop the collection">
            Explore <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="hero-image-wrap">
          <img src={image("photo-1577083288073-40892c0860a4", 1800)} alt="Abstract blue and rust artwork" />
          <div className="image-caption">
            <span>01 / 05</span>
            <span>Untitled Study No. 4 — Nia Wambui</span>
          </div>
        </div>
      </section>
      <section className="intro-section">
        <p className="section-kicker">A different kind of gallery</p>
        <div>
          <h2>Art that stays<br /><em>with you.</em></h2>
          <p className="intro-text">We believe the right artwork changes a space, then quietly changes you.</p>
          <Link className="text-link" href="/about">Our point of view <ArrowUpRight /></Link>
        </div>
      </section>
      <section className="collection-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Curated / 02</p>
            <h2>Ways of seeing</h2>
          </div>
          <Link className="text-link" href="/collections">View collections <ArrowUpRight /></Link>
        </div>
        <div className="collection-grid">
          {data?.collections.slice(0, 2).map((collection, index) => (
            <Link className={`collection-card ${index === 0 ? "collection-card-tall" : ""}`} href={`/collections/${collection.slug}`} key={collection.slug}>
              <div className="collection-image">
                <img src={collection.image} alt={`${collection.title} collection`} loading="lazy" decoding="async" />
              </div>
              <div className="collection-meta">
                <p>{collection.title}</p>
                <h3>{collection.line}</h3>
                <ArrowUpRight />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="works-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">The latest / 03</p>
            <h2>Works to live with</h2>
          </div>
          <Link className="text-link" href="/shop">Shop all work <ArrowUpRight /></Link>
        </div>
        {loading && <p role="status">Loading selected artwork…</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="art-grid">
          {data?.products.map((product) => (
            <ProductCard key={product.slug} p={product} onAdd={onAdd} signedIn={signedIn} adding={adding} returnTo="/" />
          ))}
        </div>
      </section>
    </>
  );
}
