// ─────────────────────────────────────────────────────────────────────────────
// Image intake — the defence against Failure #3.
//
// ~100 phone photos arrived as "WhatsApp Image 2026-08-07 at 10.13.13 PM.jpeg"
// with nothing tying them to a SKU. The rule: an image is bound to a productId
// AT UPLOAD TIME, before it enters the library. An unbound image is not a
// library image — it is a staging item that shows up in the review queue.
//
// One product may hold several images; several photos may collapse into one
// product. HEIC is handled at the IO boundary (see heicToJpeg) so the rest of
// the system only ever sees web-servable URLs.
// ─────────────────────────────────────────────────────────────────────────────

import type { ImageRole, Multilingual, PimImage } from "./types";

export interface StagedPhoto {
  tempId: string;
  originalFilename: string; // e.g. "WhatsApp Image 2026-08-07 at 10.13.13 PM.jpeg"
  url: string; // already uploaded to Cloudinary staging
  isHeic: boolean;
}

export interface BindRequest {
  tempId: string;
  productId: string; // REQUIRED — binding without a product is rejected
  role: ImageRole;
  sortOrder: number;
  alt: Multilingual;
  confirmedBy: string; // staff identity — audited
  isAiGenerated?: boolean;
}

export class UnboundImageError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "UnboundImageError";
  }
}

/**
 * Bind a staged photo to a product. Refuses to create a library image without a
 * productId and a confirming staff identity — this is what makes Failure #3
 * impossible by construction.
 */
export function bindPhoto(staged: StagedPhoto, req: BindRequest, mkImageId: () => string): PimImage {
  if (staged.tempId !== req.tempId) {
    throw new UnboundImageError("Bind request does not match the staged photo.");
  }
  if (!req.productId) {
    throw new UnboundImageError("Cannot enter the library without a productId — bind at upload time.");
  }
  if (!req.confirmedBy) {
    throw new UnboundImageError("Cannot confirm an image without a staff identity.");
  }
  return {
    imageId: mkImageId(),
    productId: req.productId,
    url: staged.url,
    role: req.role,
    sortOrder: req.sortOrder,
    alt: req.alt,
    isAiGenerated: req.isAiGenerated ?? false,
    sourcePhotoRef: staged.originalFilename,
    confirmedBy: req.confirmedBy,
    confirmedAt: new Date().toISOString(),
  };
}

// Renamed for clarity in the signature above.
function mkImageId(): string {
  return `img_${Math.random().toString(36).slice(2, 10)}`;
}
void mkImageId;

/**
 * HEIC handling boundary. In the app this delegates to Cloudinary (which
 * transcodes HEIC on upload) or a sharp/heic-convert step; the PIM core only
 * ever stores the resulting web URL. Declared here so the intake contract is
 * explicit and testable.
 */
export interface HeicConverter {
  toWebUrl(heicUrl: string): Promise<string>;
}
