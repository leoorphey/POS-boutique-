/*
  Warnings:

  - The values [WAVE] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `wavePaidAt` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `waveQrCodeData` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `waveReference` on the `sales` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paydunyaReference]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('PAYDUNYA', 'ESPECES', 'NEGOCIE');
ALTER TABLE "sales" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- DropIndex
DROP INDEX "sales_waveReference_key";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "wavePaidAt",
DROP COLUMN "waveQrCodeData",
DROP COLUMN "waveReference",
ADD COLUMN     "negotiatedPaymentMethod" TEXT,
ADD COLUMN     "paydunyaInvoiceUrl" TEXT,
ADD COLUMN     "paydunyaPaidAt" TIMESTAMP(3),
ADD COLUMN     "paydunyaQrCodeData" TEXT,
ADD COLUMN     "paydunyaReference" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "sales_paydunyaReference_key" ON "sales"("paydunyaReference");
