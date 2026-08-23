import { PrismaClient } from "@prisma/client";
import { catalog } from "../src/data/catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ASERTI catalog…");

  for (const p of catalog) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        models: p.models.join(","),
        category: p.category,
        material: p.material,
        gem: p.gem ?? null,
        sizeInfo: p.sizeInfo ?? null,
        weight: p.weight,
        price: p.price,
        featured: p.featured ?? false,
        images: (p.images ?? []).join(","),
        nameKa: p.name.ka,
        nameEn: p.name.en,
        nameRu: p.name.ru,
        descKa: p.desc.ka,
        descEn: p.desc.en,
        descRu: p.desc.ru,
      },
      create: {
        slug: p.slug,
        models: p.models.join(","),
        category: p.category,
        material: p.material,
        gem: p.gem ?? null,
        sizeInfo: p.sizeInfo ?? null,
        weight: p.weight,
        price: p.price,
        featured: p.featured ?? false,
        images: (p.images ?? []).join(","),
        nameKa: p.name.ka,
        nameEn: p.name.en,
        nameRu: p.name.ru,
        descKa: p.desc.ka,
        descEn: p.desc.en,
        descRu: p.desc.ru,
      },
    });
  }

  const count = await prisma.product.count();
  console.log(`Done. ${count} products in catalog.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
