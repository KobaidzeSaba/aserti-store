"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "./ProductImage";

export function ProductGallery({
  category,
  gem,
  images,
  alt,
}: {
  category: string;
  gem?: string | null;
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-sm border border-silver-muted/15">
        <ProductImage category={category} gem={gem} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-sm border border-silver-muted/15">
        <Image
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={
                "relative aspect-square w-20 overflow-hidden rounded-sm border transition-colors " +
                (i === active
                  ? "border-champagne"
                  : "border-silver-muted/20 hover:border-champagne/60")
              }
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
