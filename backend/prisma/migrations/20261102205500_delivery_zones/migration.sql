-- Tarifa plana de delivery por tienda y zonas por rango de distancia
ALTER TABLE "Store" ADD COLUMN "delivery_fee" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE "DeliveryZone" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "min_distance_km" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "max_distance_km" DECIMAL(8,2),
    "fee" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeliveryZone_store_id_idx" ON "DeliveryZone"("store_id");

ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
