-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEUR');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WAVE', 'ESPECES', 'NEGOCIE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VENDEUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "ram" TEXT,
    "stockage" TEXT,
    "couleur" TEXT,
    "imei" TEXT,
    "numeroSerie" TEXT,
    "prixAchat" DECIMAL(12,2) NOT NULL,
    "prixVente" DECIMAL(12,2) NOT NULL,
    "quantiteStock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "sellerId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "montantRecu" DECIMAL(12,2),
    "monnaieARendre" DECIMAL(12,2),
    "prixOriginal" DECIMAL(12,2),
    "prixNegocie" DECIMAL(12,2),
    "waveReference" TEXT,
    "waveQrCodeData" TEXT,
    "wavePaidAt" TIMESTAMP(3),
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imei" TEXT,
    "serialNumber" TEXT,
    "productName" TEXT NOT NULL,
    "productBrand" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "products_imei_key" ON "products"("imei");

-- CreateIndex
CREATE UNIQUE INDEX "products_numeroSerie_key" ON "products"("numeroSerie");

-- CreateIndex
CREATE INDEX "products_nom_marque_modele_idx" ON "products"("nom", "marque", "modele");

-- CreateIndex
CREATE INDEX "products_imei_idx" ON "products"("imei");

-- CreateIndex
CREATE INDEX "products_numeroSerie_idx" ON "products"("numeroSerie");

-- CreateIndex
CREATE INDEX "products_categorieId_idx" ON "products"("categorieId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sales_reference_key" ON "sales"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "sales_waveReference_key" ON "sales"("waveReference");

-- CreateIndex
CREATE INDEX "sales_sellerId_idx" ON "sales"("sellerId");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
