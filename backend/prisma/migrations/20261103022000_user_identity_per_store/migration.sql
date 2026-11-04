-- La identidad del cliente pasa a ser por tienda: un mismo correo o teléfono
-- puede existir en tiendas distintas, pero no duplicarse dentro de una tienda.

-- DropIndex
DROP INDEX "User_email_key";
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "VerificationCode" ADD COLUMN "store_id" INTEGER;

-- DropIndex
DROP INDEX "VerificationCode_email_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_store_id_email_key" ON "User"("store_id", "email");
CREATE UNIQUE INDEX "User_store_id_phone_key" ON "User"("store_id", "phone");
CREATE UNIQUE INDEX "VerificationCode_store_id_email_code_key" ON "VerificationCode"("store_id", "email", "code");
