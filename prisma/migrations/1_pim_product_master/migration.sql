-- Product Master (PIM) tables. Adds pim_* tables and pim_staff_user.
-- Independent of the storefront Product/Order tables from 0_init.

-- CreateTable
CREATE TABLE "pim_staff_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pim_staff_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pim_product" (
    "productId" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "nameRu" TEXT NOT NULL DEFAULT '',
    "descKa" TEXT NOT NULL DEFAULT '',
    "descEn" TEXT NOT NULL DEFAULT '',
    "descRu" TEXT NOT NULL DEFAULT '',
    "brand" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "categorySlug" TEXT,
    "ageLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pim_product_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "pim_product_code" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pim_product_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pim_fina_sync" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceRow" TEXT NOT NULL,

    CONSTRAINT "pim_fina_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pim_image" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "url" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'hero',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altKa" TEXT NOT NULL DEFAULT '',
    "altEn" TEXT NOT NULL DEFAULT '',
    "altRu" TEXT NOT NULL DEFAULT '',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sourcePhotoRef" TEXT,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "pim_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pim_category" (
    "slug" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "nameRu" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "pim_category_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "pim_channel_category_map" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "internalSlug" TEXT NOT NULL,
    "channelCategory" TEXT NOT NULL,

    CONSTRAINT "pim_channel_category_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pim_channel_listing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "priceOverride" DOUBLE PRECISION,
    "lastExportAt" TIMESTAMP(3),
    "lastExportResult" TEXT,

    CONSTRAINT "pim_channel_listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pim_link_audit" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "leftRef" TEXT NOT NULL,
    "rightProductId" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decision" TEXT NOT NULL DEFAULT 'proposed',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pim_link_audit_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "pim_staff_user_email_key" ON "pim_staff_user"("email");

-- CreateIndex
CREATE INDEX "pim_product_status_idx" ON "pim_product"("status");

-- CreateIndex
CREATE INDEX "pim_product_categorySlug_idx" ON "pim_product"("categorySlug");

-- CreateIndex
CREATE INDEX "pim_product_code_productId_idx" ON "pim_product_code"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "pim_product_code_scheme_code_key" ON "pim_product_code"("scheme", "code");

-- CreateIndex
CREATE INDEX "pim_fina_sync_productId_idx" ON "pim_fina_sync"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "pim_fina_sync_productId_location_key" ON "pim_fina_sync"("productId", "location");

-- CreateIndex
CREATE INDEX "pim_image_productId_idx" ON "pim_image"("productId");

-- CreateIndex
CREATE INDEX "pim_channel_category_map_channel_idx" ON "pim_channel_category_map"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "pim_channel_category_map_channel_internalSlug_key" ON "pim_channel_category_map"("channel", "internalSlug");

-- CreateIndex
CREATE INDEX "pim_channel_listing_channel_idx" ON "pim_channel_listing"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "pim_channel_listing_productId_channel_key" ON "pim_channel_listing"("productId", "channel");

-- CreateIndex
CREATE INDEX "pim_link_audit_kind_decision_idx" ON "pim_link_audit"("kind", "decision");


-- AddForeignKey
ALTER TABLE "pim_product_code" ADD CONSTRAINT "pim_product_code_productId_fkey" FOREIGN KEY ("productId") REFERENCES "pim_product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pim_fina_sync" ADD CONSTRAINT "pim_fina_sync_productId_fkey" FOREIGN KEY ("productId") REFERENCES "pim_product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pim_image" ADD CONSTRAINT "pim_image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "pim_product"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pim_channel_listing" ADD CONSTRAINT "pim_channel_listing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "pim_product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

