-- AlterTable Product: add prescription_type
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "prescription_type" TEXT NOT NULL DEFAULT 'NONE';

-- Update existing products with requires_prescription = true to 'RETAIN_ORIGINAL' by default
UPDATE "Product" SET "prescription_type" = 'RETAIN_ORIGINAL' WHERE "requires_prescription" = true AND "prescription_type" = 'NONE';

-- AlterTable Order: add prescription_type
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescription_type" TEXT NOT NULL DEFAULT 'NONE';

-- CreateTable PrescriptionQuote
CREATE TABLE IF NOT EXISTS "PrescriptionQuote" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "delivery_address" TEXT,
    "prescription_url" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "items" JSONB,
    "total_usd" DECIMAL(12,2),
    "total_ves" DECIMAL(14,2),
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrescriptionQuote_store_id_idx" ON "PrescriptionQuote"("store_id");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrescriptionQuote_store_id_fkey') THEN
    ALTER TABLE "PrescriptionQuote" ADD CONSTRAINT "PrescriptionQuote_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrescriptionQuote_user_id_fkey') THEN
    ALTER TABLE "PrescriptionQuote" ADD CONSTRAINT "PrescriptionQuote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
