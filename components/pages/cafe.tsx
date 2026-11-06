"use client";

import { useEffect, useState } from "react";
import { Alert, Image, Spin } from "antd";
import hero from "../../images/background.jpg";
import menuCover from "../../images/menu.jpg";
import {
  getCafeMenuPdfUrl,
  getCafeGallery,
  getCafeMenu,
} from "@/services/api";
import type { CafeGalleryImage } from "@/services/api";

function getGalleryImageUrl(image: CafeGalleryImage) {
  return image.imageUrl || image.url || "";
}

export function CafePage() {
  const [menuUrl, setMenuUrl] = useState("");
  const [gallery, setGallery] = useState<CafeGalleryImage[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [galleryError, setGalleryError] = useState("");

  useEffect(() => {
    let active = true;

    getCafeMenu()
      .then(({ data }) => {
        if (active) setMenuUrl(getCafeMenuPdfUrl(data));
      })
      .catch((reason: unknown) => {
        if (active) setMenuError(reason instanceof Error ? reason.message : "Unable to load the cafe menu.");
      })
      .finally(() => {
        if (active) setMenuLoading(false);
      });

    getCafeGallery()
      .then(({ data }) => {
        if (active) setGallery(data);
      })
      .catch((reason: unknown) => {
        if (active) setGalleryError(reason instanceof Error ? reason.message : "Unable to load the cafe gallery.");
      })
      .finally(() => {
        if (active) setGalleryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="cafe-page">
      <div className="cafe-container">
        <section
          className="cafe-hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${hero.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {menuLoading ? (
            <div role="status"><Spin /> <span>Loading cafe menu…</span></div>
          ) : menuError ? (
            <Alert type="error" showIcon title={menuError} />
          ) : menuUrl ? (
            <a className="cafe-menu-card" href={menuUrl} target="_blank" rel="noopener noreferrer">
              <img src={menuCover.src} alt="View the Niyo Art Cafe menu PDF" />
            </a>
          ) : (
            <p role="status">The cafe menu is not available right now.</p>
          )}
        </section>

        <div className="cafe-divider" />

        <section className="cafe-gallery" aria-label="Cafe gallery">
          {galleryLoading ? (
            <div role="status"><Spin /> <span>Loading cafe gallery…</span></div>
          ) : galleryError ? (
            <Alert type="error" showIcon title={galleryError} />
          ) : gallery.length ? (
            gallery.map((image, index) => {
              const src = getGalleryImageUrl(image);
              return src ? (
                <Image key={image.id} src={src} alt={image.alt || `Cafe photo ${index + 1}`} />
              ) : null;
            })
          ) : (
            <p>No cafe photos are available yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
