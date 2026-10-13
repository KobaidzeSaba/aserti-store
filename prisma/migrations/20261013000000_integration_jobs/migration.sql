CREATE TABLE "IntegrationJob" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IntegrationJob_reference_kind_key" ON "IntegrationJob"("reference", "kind");
CREATE INDEX "IntegrationJob_status_createdAt_idx" ON "IntegrationJob"("status", "createdAt");
