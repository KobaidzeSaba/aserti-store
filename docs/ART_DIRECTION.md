# ASERTI — A world of objects

## Implemented direction

Warm-white interface, dark charcoal typography, oversized titles, small technical
captions and generous space. The homepage moves through object study → materials
→ visual language → stone/mirror → 101 → selected objects → Tbilisi.

The shop is a separate, practical object index. Product pages lead with the name
and a large photograph, then a surface detail, followed by specifications and
purchase controls. The original product catalog, prices, material descriptions,
size choices, and payment/shipping integrations remain the commercial source.

Georgian, English and Russian remain available. Brand words such as ASERTI,
Objects and Studio are international; transactions retain their existing locale.

## Content and extension points

- `src/data/objectPresentation.ts`: optional title, type, year, collection, edition,
  dimensions and a video source/poster. Add editorial metadata for future objects
  here. Omitted fields are not rendered. This layer requires no database migration.
- `src/data/catalog.ts`: seed catalog. Categories accept arbitrary strings.
  Shop navigation is derived from active products and never advertises empty types.
- `src/lib/editorial.ts`: concise localized editorial copy and category labels.
  Register localized labels here when introducing a new category.
- `Product.images`: keeps its existing comma-separated image paths. The first is
  the primary image, the second a detail, remaining images an additional gallery.
  With one image, the detail is explicitly an enlarged view of that same image.
- `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_INSTAGRAM_URL`: verified public
  contact channels. Social links and the editorial social stream appear only when
  configured. No address or account has been invented.

The presentation supports future object categories. Digital fulfillment,
inventory, edition allocation and other new business rules would still need
backend implementation when those product types launch.

Production image optimization uses Sharp, following the [Next.js image guidance](https://nextjs.org/docs/messages/sharp-missing-in-production).

## Motion and accessibility

The opening object drifts slowly with a pause/resume control. Material images use
subtle hover scaling; the horizontal study is scrollable and has arrow buttons.
Below-the-fold sections reveal once when entering view. Content remains visible
without JavaScript; reduced-motion preferences disable movement and reveals.

The layout uses one-column object displays on phones, a collapsible mobile menu,
a skip link, visible keyboard focus, explicit checkout labels and semantic headings.

## Preview without credentials

```bash
CATALOG_PREVIEW=1 npm run dev -- --hostname 127.0.0.1 --port 3040
```

This uses the unchanged seed catalog and actual product photos. Cart interaction
works in browser storage. Checkout is explicitly blocked with HTTP 503 so the
preview cannot create fake orders or initiate payments. Set `CATALOG_PREVIEW=0`
and configure the development Neon database for a complete purchase test.

## Imagery

Existing product photography is unchanged and displayed without a forced grayscale
filter. `fusion.jpg` and `raw-stone.jpg` remain the original conceptual assets.
No video or documentary studio/city photographs were supplied; the design uses
subtle still-image motion and an editorial material study. The video slot is ready
for supplied footage and includes playback controls. Replace concept imagery with
actual process photography when available.

Two assets were created with the built-in imagegen tool:

### `public/brand/material-study.png`

An artistic editorial image, not a photograph claimed to document ASERTI's actual
studio or an object offered for sale.

Prompt:

> Use case: photorealistic-natural. Asset type: an editorial MATERIAL STUDY photograph for ASERTI, an experimental contemporary design project. Create one very high-quality photographic image, wide 3:2 composition, of a sculptural raw off-white translucent wax block with a curved cavity and soft hand-worked surface, a single crumpled sheet of reflective silver metal and a small charcoal rough stone on a warm pale plaster studio table. Intimate macro still-life, materials fill much of frame, oblique crop, quiet side window light, deep organic shadows, tactile grain and surface detail, restrained art-book photography. Neutral warm ivory, silver, grey with natural subtle wax warmth. Asymmetric almost abstract composition, no jewelry, no identifiable commercial product, no tools, no people, no flowers, no decorative objects, no text, no lettering, no logos, no watermark. This is an artistic material study, not an ecommerce product photo. Save the image for use in the website project.

### `public/brand/fusion-cutout.png`

Transparent derivative of the existing conceptual `fusion.jpg`, used in the hero
and Contact page. The original and saleable product photos are untouched.

Prompt:

> Use case: background-extraction. Edit target: the attached ASERTI stone and mirror conceptual object image. Remove ONLY the pale studio background and tabletop. Preserve the exact shape, scale, position, rough black stone texture, chrome reflective highlights and object silhouette. No redesign, no new objects, no text. Output a clean high-resolution RGBA PNG with genuine transparent background, not a checkerboard, keeping the whole object unclipped and a very soft small transparent contact shadow directly below it. Keep plenty of transparent space around the object so it can float on a warm-white website. Do not change the object itself.

## Verification — 2026-09-25

- Ten regression tests passed; TypeScript and the production build passed.
- All ten canonical catalog records match the original repository, including
  names, prices, material descriptions, size information and product models.
- Checked the desktop presentation and 390px/320px mobile layouts, including
  Georgian navigation. No horizontal overflow was observed on the checked pages.
- Browser-tested material filtering with descending price sorting, product size
  and quantity selection, a two-item cart total of ₾520, cart persistence after
  reload and the checkout screen. Removed the local test cart afterward.
- Confirmed normal responses for storefront, Studio, 101, Contact, shop, product,
  cart and checkout pages; unknown products/categories return 404.
- Preview checkout returns 503. No database-backed order, real payment, courier
  shipment or outbound email was created during verification.
