import Image from "next/image";
import { ProductImage } from "./ProductImage";
import type { ObjectPresentation } from "@/data/objectPresentation";

export function ProductGallery({
  category,
  gem,
  images,
  alt,
  detailLabel,
  material,
  video,
}: {
  category: string;
  gem?: string | null;
  images: string[];
  alt: string;
  detailLabel: string;
  material: string;
  video?: ObjectPresentation["video"];
}) {
  const first = images[0];
  return (
    <div className="object-gallery">
      <figure className="object-main-image">
        {first ? (
          <Image src={first} alt={alt} fill priority sizes="92vw" />
        ) : (
          <ProductImage
            category={category}
            gem={gem}
            className="h-full w-full"
          />
        )}
      </figure>
      {first && (
        <div className="object-detail-row">
          <div className="object-detail-caption" data-reveal>
            <p>{material}</p>
            <span className="micro muted">{detailLabel}</span>
          </div>
          <figure className="object-detail-image" data-reveal>
            <Image
              src={images[1] ?? first}
              alt={`${alt} — surface detail (enlarged view)`}
              fill
              sizes="(max-width: 700px) 75vw, 35vw"
            />
          </figure>
        </div>
      )}
      {images.length > 2 && (
        <div className="object-gallery-grid">
          {images.slice(2).map((src) => (
            <figure key={src}>
              <Image src={src} alt={alt} fill sizes="50vw" />
            </figure>
          ))}
        </div>
      )}
      {video && (
        <video
          className="object-video"
          controls
          playsInline
          preload="none"
          poster={video.poster}
        >
          <source src={video.src} />
          <a href={video.src}>View object video</a>
        </video>
      )}
    </div>
  );
}
