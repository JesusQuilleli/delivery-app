-- AlterTable Store
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'EMPRENDEDOR';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "plan_price" DECIMAL(12,2) NOT NULL DEFAULT 15.0;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "subscription_status" TEXT NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3);
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "next_billing_date" TIMESTAMP(3);
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "subscription_notes" TEXT;

-- CreateTable SubscriptionPayment
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_method" TEXT NOT NULL DEFAULT 'PAGO_MOVIL',
    "payment_reference" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "notes" TEXT,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_store_id_idx" ON "SubscriptionPayment"("store_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SubscriptionPayment_store_id_fkey'
    ) THEN
        ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
