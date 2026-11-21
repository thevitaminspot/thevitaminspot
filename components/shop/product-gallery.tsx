"use client";

import Image from "next/image";
import { useState } from "react";
import { PRODUCT_MAX_IMAGES } from "@/lib/catalog";

export type ProductGalleryImage = { url: string; alt: string };

const FALLBACK = "/images/lifestyle/table-02.jpg";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductGalleryImage[];
  productName: string;
}) {
  const slides = (
    images.length > 0 ? images : [{ url: FALLBACK, alt: productName }]
  ).slice(0, PRODUCT_MAX_IMAGES);

  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-2xl border border-deep/10 bg-tint/30">
        <Image
          src={current.url}
          alt={current.alt}
          width={900}
          height={1125}
          sizes="(min-width: 1280px) 560px, (min-width: 1024px) 48vw, 100vw"
          className="aspect-[4/5] w-full object-cover"
          preload
        />
      </div>

      {slides.length > 1 ? (
        <div className="flex gap-3">
          {slides.map((image, i) => {
            const active = i === index;
            return (
              <button
                key={`${image.url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`min-w-0 flex-1 overflow-hidden rounded-xl border transition ${
                  active
                    ? "border-deep"
                    : "border-deep/10 hover:border-deep/30"
                }`}
                aria-label={`Show image ${i + 1} of ${slides.length}`}
                aria-pressed={active}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={280}
                  height={280}
                  loading="lazy"
                  sizes="(min-width: 1024px) 12vw, 22vw"
                  className="aspect-square w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
