-- Add geocoded coordinates (Google Places) to Order for precise courier delivery.
ALTER TABLE "Order" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "longitude" DOUBLE PRECISION;
