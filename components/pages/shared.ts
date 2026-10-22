"use client";

import { useEffect, useState } from "react";
import type { ApiArtist, ApiCollection, ApiProduct } from "@/services/api";
import type { CartProduct } from "@/components/site-provider";

export const image = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export type Product = {
  slug: string;
  title: string;
  artist: string;
  artistSlug: string;
  artistImage: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  description: string;
};

export type Collection = {
  slug: string;
  title: string;
  line: string;
  text: string;
  image: string;
  products: Product[];
};

export type Artist = {
  slug: string;
  name: string;
  location: string;
  medium: string;
  bio: string;
  image: string;
  products: Product[];
  workCount?: number;
  startingPrice?: number | null;
};

export function toProduct(product: ApiProduct): Product {
  return {
    slug: product.slug,
    title: product.title,
    artist: product.artist.name,
    artistSlug: product.artist.slug,
    artistImage: product.artist.imageUrl,
    type: product.type,
    category: product.category,
    price: product.price,
    currency: product.currency,
    image: product.imageUrl,
    description: product.description,
  };
}

export function formatPrice(price: number, currency = "USD") {
  return currency === "USD" ? `$${price.toLocaleString()}` : `${currency} ${price.toLocaleString()}`;
}

export function toCollection(collection: ApiCollection): Collection {
  return {
    slug: collection.slug,
    title: collection.title,
    line: collection.line,
    text: collection.description,
    image: collection.imageUrl,
    products: collection.products.map(toProduct),
  };
}

export function toArtist(artist: ApiArtist): Artist {
  return {
    slug: artist.slug,
    name: artist.name,
    location: artist.location,
    medium: artist.medium,
    bio: artist.bio || "",
    image: artist.imageUrl,
    products: artist.products.map(toProduct),
    workCount: artist.workCount,
    startingPrice: artist.startingPrice,
  };
}

export function useResource<T>(load: () => Promise<T>, dependencies: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    load()
      .then((result) => {
        if (current) setData(result);
      })
      .catch((reason: unknown) => {
        if (current) setError(reason instanceof Error ? reason.message : "Unable to load data.");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, dependencies);

  return { data, error, loading };
}

export const nav = [
  ["Gallery", "/gallery"],
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Artists", "/artists"],
  ["About", "/about"],
];

export function groupCartItems(items: CartProduct[]) {
  const groups = new Map<string, { product: CartProduct; quantity: number }>();
  items.forEach((product) => {
    const g = groups.get(product.slug);
    if (g) g.quantity += 1;
    else groups.set(product.slug, { product, quantity: 1 });
  });
  return Array.from(groups.values());
}
