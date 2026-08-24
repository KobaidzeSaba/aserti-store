import Image from "next/image";
import { ProductImage } from "./ProductImage";

/**
 * Renders a real product photo when one is available (from Product.images),
 * otherwise falls back to the category vector placeholder.
 *
 * To add photos: drop files in /public/products/ and list their paths in
 * src/data/catalog.ts (e.g. images: ["/products/wave-ring-1.jpg"]), then
 * re-run `npm run db:seed`.
 */
export function ProductMedia({
  category,
  gem,
  images,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
}: {
  category: string;
  gem?: string | null;
  images?: string[];
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const src = images?.[0];
  if (!src) {
    return <ProductImage category={category} gem={gem} className={className} />;
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover grayscale"
      />
    </div>
  );
}
