"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Alert, Carousel, Empty, Spin } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getCollections, getProducts } from "@/services/api";
import { ProductCard } from "./catalog-pages";
import { toCollection, toProduct } from "./shared";
import type { Collection, Product } from "./shared";
import missionImage from "../../images/african.jpg";
import galleryHero from "../../images/hero.jpg";
import cafeHero from "../../images/overview.jpg";


export function HomePage({
  onAdd,
  adding,
}: {
  onAdd: (product: Product) => Promise<void>;
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
     <Carousel className="hero-carousel" autoplay={{ dotDuration: true }} autoplaySpeed={2500}>
  <div>
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Niyo Arts Center · Kigali, Rwanda</p>
        <h1>Discover the gallery.</h1>
        <p className="hero-description">
          Explore the work of 17 artists in residence from the Great Lakes region.
        </p>
        <Link className="circle-link" href="/gallery" aria-label="Visit the gallery">
          Visit gallery <ArrowRightOutlined />
        </Link>
      </div>

      <div className="hero-image-wrap">
        <Image
          src={galleryHero}
          alt="Artists and community at Niyo Arts Center"
          fill
          priority
          sizes="(min-width: 960px) 58vw, 100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="image-caption">
          <span>Niyo Arts Center</span>
          <span>Kigali, Rwanda</span>
        </div>
      </div>
    </section>
  </div>

  <div>
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Niyo Art Cafe · Kigali, Rwanda</p>
        <h1>Make room for creativity.</h1>
        <p className="hero-description">
          Enjoy coffee from Rwanda at Niyo Art Cafe. Forty percent of café profits support Niyo Foundation.
        </p>
        <Link className="circle-link" href="/cafe" aria-label="Visit Niyo Art Cafe">
          Visit cafe <ArrowRightOutlined />
        </Link>
      </div>

      <div className="hero-image-wrap cafe-hero-image">
        <Image
          src={cafeHero}
          alt="Inside Niyo Art Cafe"
          fill
          sizes="(min-width: 960px) 58vw, 100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="image-caption">
          <span>Niyo Art Cafe</span>
          <span>Rwandan coffee · Art · Community</span>
        </div>
      </div>
    </section>
  </div>
</Carousel>
      <section className="intro-section">
        <p className="section-kicker">Our mission</p>
        <div className="intro-copy">
          <h2>A space for Rwandan creative artists.</h2>
          <p className="intro-text">
            Niyo Arts Center provides a space for Rwandan creative artists to explore their talents and express themselves freely.
          </p>
          <Link className="text-link" href="/artists">Meet our artists <ArrowRightOutlined /></Link>
        </div>
        <div className="intro-image">
          <Image
            src={missionImage}
            alt="Artists performing at Niyo Arts Center"
            sizes="(min-width: 960px) 42vw, 100vw"
          />
        </div>
      </section>
      <section className="cafe-section">
        <p className="section-kicker">Niyo Art Cafe</p>
        <div>
          <h2>Our coffee evokes creativity.</h2>
          <p>
            Enjoy coffee from Rwanda at Niyo Art Cafe. Forty percent of café profits support Niyo Foundation, which supports women and children living in poverty in Rwanda.
          </p>
          <Link className="text-link" href="/contact">Visit us in Kigali <ArrowRightOutlined /></Link>
        </div>
      </section>
      <section className="collection-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Niyo Arts Center</p>
            <h2>Curated Works</h2>
          </div>
          <Link className="text-link" href="/collections">View Curated Works <ArrowRightOutlined /></Link>
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
                <ArrowRightOutlined />
              </div>
            </Link>
          ))}
        </div>
        {!data?.collections?.length && !loading && (
          <div className="collection-grid">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No collections available yet" />
          </div>
        )}
      </section>
      <section className="works-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">From the gallery</p>
            <h2>Available artwork</h2>
          </div>
          <Link className="text-link" href="/shop">View all artwork <ArrowRightOutlined /></Link>
        </div>
        {loading && <div role="status"><Spin size="small" /> Loading selected artwork…</div>}
        {error && <Alert showIcon type="error" title={error} />}
        <div className="art-grid">
          {data?.products.map((product) => (
            <ProductCard key={product.slug} p={product} onAdd={onAdd} adding={adding} />
          ))}
        </div>
        {!data?.products?.length && !loading && (
          <div className="art-grid">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No artwork available yet" />
          </div>
        )}
      </section>
    </>
  );
}
