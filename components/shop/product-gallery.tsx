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
    <div className="grid gap-4">
      <Image
        src={current.url}
        alt={current.alt}
        width={900}
        height={1100}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="w-full rounded-2xl object-cover"
        priority
      />
      {slides.length > 1 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {slides.map((image, i) => {
            const active = i === index;
            return (
              <button
                key={`${image.url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-cream transition ${
                  active ? "ring-deep" : "ring-transparent hover:ring-deep/25"
                }`}
                aria-label={`Show image ${i + 1} of ${slides.length}`}
                aria-current={active}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={280}
                  height={280}
                  loading="lazy"
                  sizes="(min-width: 1024px) 15vw, 30vw"
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
