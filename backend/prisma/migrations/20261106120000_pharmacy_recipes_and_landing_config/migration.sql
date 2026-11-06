-- AlterTable Store
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "landing_config" JSONB;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "parent_store_id" INTEGER;

-- AddForeignKey for Store branches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Store_parent_store_id_fkey') THEN
    ALTER TABLE "Store" ADD CONSTRAINT "Store_parent_store_id_fkey" FOREIGN KEY ("parent_store_id") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "requires_prescription" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lot_number" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescription_url" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescription_status" TEXT NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescription_notes" TEXT;
