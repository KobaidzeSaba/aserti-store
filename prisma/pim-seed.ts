/**
 * Seed the Product Master (PIM) tables from the same fixtures the failure tests
 * use, so the admin dashboard shows a realistic — and deliberately broken —
 * catalogue: the two-scheme barcode collisions, the near-duplicate names, the
 * unbound WhatsApp photos, the barcode-less ZEALOT speaker, the unmapped
 * category, and the split-location stock. Idempotent: it clears the pim_* tables
 * first. Run with:  npm run db:seed:pim
 */
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import * as F from "../src/lib/pim/__fixtures__/data";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

function client(): PrismaClient {
  const url = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: url });
  return new PrismaClient({ adapter: new PrismaNeon(pool) });
}

async function main() {
  const prisma = client();
  console.log("Seeding PIM fixtures…");

  // Clear (children first).
  await prisma.pimChannelListing.deleteMany();
  await prisma.pimLinkAudit.deleteMany();
  await prisma.pimImage.deleteMany();
  await prisma.pimFinaSync.deleteMany();
  await prisma.pimProductCode.deleteMany();
  await prisma.pimChannelCategoryMap.deleteMany();
  await prisma.pimCategory.deleteMany();
  await prisma.pimProduct.deleteMany();
  await prisma.staffUser.deleteMany();

  await prisma.staffUser.create({
    data: { email: "staff@aserti", displayName: "Aserti Staff", role: "admin" },
  });

  for (const c of F.categories) {
    await prisma.pimCategory.create({
      data: { slug: c.slug, nameKa: c.name.ka, nameEn: c.name.en, nameRu: c.name.ru },
    });
  }

  for (const m of F.categoryMaps) {
    await prisma.pimChannelCategoryMap.create({
      data: { channel: m.channel, internalSlug: m.internalSlug, channelCategory: m.channelCategory },
    });
  }

  for (const p of F.products) {
    await prisma.pimProduct.create({
      data: {
        productId: p.productId,
        nameKa: p.name.ka,
        nameEn: p.name.en,
        nameRu: p.name.ru,
        descKa: p.description.ka,
        descEn: p.description.en,
        descRu: p.description.ru,
        brand: p.brand,
        status: p.status,
        categorySlug: p.categorySlug,
        ageLabel: p.ageLabel,
      },
    });
  }

  for (const c of F.codes) {
    await prisma.pimProductCode.create({
      data: { productId: c.productId, scheme: c.scheme, code: c.code, validFrom: new Date(c.validFrom) },
    });
  }

  for (const r of F.fina) {
    await prisma.pimFinaSync.create({
      data: {
        productId: r.productId,
        location: r.location,
        quantity: r.quantity,
        price: r.price,
        cost: r.cost,
        syncedAt: new Date(r.syncedAt),
        sourceRow: r.sourceRow,
      },
    });
  }

  for (const i of F.images) {
    await prisma.pimImage.create({
      data: {
        id: i.imageId,
        productId: i.productId || null,
        url: i.url,
        role: i.role,
        sortOrder: i.sortOrder,
        altKa: i.alt.ka,
        altEn: i.alt.en,
        altRu: i.alt.ru,
        isAiGenerated: i.isAiGenerated,
        sourcePhotoRef: i.sourcePhotoRef,
        confirmedBy: i.confirmedBy,
        confirmedAt: i.confirmedAt ? new Date(i.confirmedAt) : null,
      },
    });
  }

  console.log(
    `PIM seed done: ${F.products.length} products, ${F.codes.length} codes, ` +
      `${F.fina.length} fina rows, ${F.images.length} images.`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
