# Product photos

Drop real product photography here, then reference the files from
`src/data/catalog.ts` and re-seed.

## How to add photos

1. Add image files to this folder, e.g.:
   ```
   public/products/wave-ring-1.jpg
   public/products/wave-ring-2.jpg
   ```
2. List them on the product in `src/data/catalog.ts`:
   ```ts
   {
     slug: "wave-ring",
     // …
     images: ["/products/wave-ring-1.jpg", "/products/wave-ring-2.jpg"],
   }
   ```
   (Paths are relative to `/public`, so they start with `/products/…`.)
3. Re-seed the database:
   ```bash
   npm run db:seed
   ```

The storefront shows the first image on cards and a thumbnail gallery on the
product page. Any product without photos automatically falls back to the
category vector placeholder — so it's safe to add photos gradually.

## Recommendation

- Square images (1:1), at least **1200×1200px**, on a clean/dark background.
- JPG or WebP, optimized to < ~300 KB each.
