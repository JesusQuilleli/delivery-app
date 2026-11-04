ALTER TABLE "Order" ADD COLUMN "stock_breakdown" JSONB;
ALTER TABLE "Order" ADD COLUMN "stock_restored" BOOLEAN NOT NULL DEFAULT false;
