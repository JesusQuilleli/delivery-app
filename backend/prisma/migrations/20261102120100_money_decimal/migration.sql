-- F1-14: migrar precios y totales de Float a Decimal
ALTER TABLE "Store" ALTER COLUMN "usd_rate" TYPE DECIMAL(14, 6) USING "usd_rate"::numeric(14, 6);
ALTER TABLE "Store" ALTER COLUMN "ves_rate" TYPE DECIMAL(14, 6) USING "ves_rate"::numeric(14, 6);
ALTER TABLE "Store" ALTER COLUMN "cop_rate" TYPE DECIMAL(14, 6) USING "cop_rate"::numeric(14, 6);

ALTER TABLE "Product" ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING "price"::numeric(12, 2);

ALTER TABLE "OrderItem" ALTER COLUMN "unit_price" TYPE DECIMAL(12, 2) USING "unit_price"::numeric(12, 2);
ALTER TABLE "Order" ALTER COLUMN "total_amount" TYPE DECIMAL(12, 2) USING "total_amount"::numeric(12, 2);

-- F1-15 / F1-16: moneda, tasas congeladas y desglose del pedido
ALTER TABLE "Order" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Order" ADD COLUMN "usd_rate" DECIMAL(14, 6) NOT NULL DEFAULT 1.0;
ALTER TABLE "Order" ADD COLUMN "ves_rate" DECIMAL(14, 6) NOT NULL DEFAULT 36.5;
ALTER TABLE "Order" ADD COLUMN "cop_rate" DECIMAL(14, 6) NOT NULL DEFAULT 4000.0;
ALTER TABLE "Order" ADD COLUMN "subtotal" DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "delivery_fee" DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Rellenar pedidos existentes con la moneda y tasas de su tienda
UPDATE "Order" AS o
SET "currency" = s."currency",
    "usd_rate" = s."usd_rate",
    "ves_rate" = s."ves_rate",
    "cop_rate" = s."cop_rate",
    "subtotal" = o."total_amount"
FROM "Store" AS s
WHERE s."id" = o."store_id";
