-- Datos de pago móvil/transferencia configurables por tienda
ALTER TABLE "Store" ADD COLUMN "bank_name" TEXT;
ALTER TABLE "Store" ADD COLUMN "bank_code" TEXT;
ALTER TABLE "Store" ADD COLUMN "bank_phone" TEXT;
ALTER TABLE "Store" ADD COLUMN "bank_id_number" TEXT;
ALTER TABLE "Store" ADD COLUMN "bank_holder" TEXT;
ALTER TABLE "Store" ADD COLUMN "payment_note" TEXT;
