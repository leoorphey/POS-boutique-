import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { CreateSaleInput } from "@pos/shared";
import { Prisma, SaleStatus, StockMovementType } from "@prisma/client";
import { generateSaleReference } from "@/modules/sales/reference.util";
import { qrCodeService } from "@/services/qrcode.service";
import * as paydunyaClient from "@/services/paydunya.client";
import { env } from "@/config/env";
import { logAudit } from "@/utils/auditLog";
import { emailService } from "@/services/email.service";

async function buildSaleItemsAndValidateStock(
  tx: Prisma.TransactionClient,
  items: { productId: string; quantity: number }[]
) {
  let subtotal = new Prisma.Decimal(0);
  const preparedItems: Array<{
    productId: string;
    imei: string | null;
    serialNumber: string | null;
    productName: string;
    productBrand: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    total: Prisma.Decimal;
  }> = [];

  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });

    if (!product || !product.isActive) {
      throw AppError.notFound(`Produit introuvable : ${item.productId}`);
    }
    if (product.quantiteStock < item.quantity) {
      throw AppError.conflict(
        `Stock insuffisant pour "${product.nom}" (disponible : ${product.quantiteStock}, demandé : ${item.quantity})`
      );
    }

    const lineTotal = product.prixVente.mul(item.quantity);
    subtotal = subtotal.add(lineTotal);

    preparedItems.push({
      productId: product.id,
      imei: product.imei,
      serialNumber: product.numeroSerie,
      productName: product.nom,
      productBrand: product.marque,
      quantity: item.quantity,
      unitPrice: product.prixVente,
      total: lineTotal,
    });
  }

  return { preparedItems, subtotal };
}

async function decrementStockAndLogMovements(
  tx: Prisma.TransactionClient,
  items: { productId: string; quantity: number }[],
  saleReference: string,
  userId: string
) {
  for (const item of items) {
    // updateMany avec condition de quantité >= demande : verrouillage optimiste,
    // évite la survente si deux ventes touchent le même produit en même temps.
    const result = await tx.product.updateMany({
      where: { id: item.productId, quantiteStock: { gte: item.quantity } },
      data: { quantiteStock: { decrement: item.quantity } },
    });
    if (result.count === 0) {
      throw AppError.conflict(
        `Stock insuffisant pour le produit ${item.productId} (vente concurrente détectée)`
      );
    }
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: StockMovementType.SORTIE,
        quantity: item.quantity,
        reason: `Vente ${saleReference}`,
        userId,
      },
    });
  }
}

export const salesService = {
  async create(input: CreateSaleInput, sellerId: string) {
    const reference = await generateSaleReference();

    return prisma.$transaction(async (tx) => {
      const { preparedItems, subtotal } = await buildSaleItemsAndValidateStock(
        tx,
        input.items
      );

      const discount = new Prisma.Decimal(input.discount ?? 0);
      let total = subtotal.sub(discount);
      if (total.isNegative()) total = new Prisma.Decimal(0);

      // --- Cas ESPÈCES ---
      if (input.paymentMethod === "ESPECES") {
        const montantRecu = new Prisma.Decimal(input.montantRecu);
        if (montantRecu.lt(total)) {
          throw AppError.badRequest(
            `Montant reçu (${montantRecu}) insuffisant pour couvrir le total (${total})`
          );
        }
        const monnaieARendre = montantRecu.sub(total);

        await decrementStockAndLogMovements(tx, input.items, reference, sellerId);

        const sale = await tx.sale.create({
          data: {
            reference,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            sellerId,
            paymentMethod: "ESPECES",
            subtotal,
            discount,
            total,
            montantRecu,
            monnaieARendre,
            status: SaleStatus.PAID,
            items: { create: preparedItems },
          },
          include: { items: true, seller: { select: { id: true, nom: true, email: true } } },
        });

        await logAudit({
          userId: sellerId,
          action: "CREATE_SALE_CASH",
          entity: "Sale",
          entityId: sale.id,
          meta: { reference, total: total.toString() },
        });

        // Envoi au vendeur (best-effort)
        if (sale.seller?.email) {
          emailService.sendSaleConfirmationToSeller(sale as any, sale.seller.email).catch((err) => {
            console.error('Échec de l\'envoi de l\'email au vendeur :', err);
          });
        }

        return sale;
      }

      // --- Cas NÉGOCIÉ ---
      if (input.paymentMethod === "NEGOCIE") {
        const prixOriginal = total;
        const prixNegocie = new Prisma.Decimal(input.prixNegocie);

        // Sous-mode négocié : ESPECES (paiement cash immédiat) ou PAYDUNYA (génère facture)
        const negotiatedMethod = (input as any).negotiatedPaymentMethod || "ESPECES";

        if (negotiatedMethod === "ESPECES") {
          if (typeof input.montantRecu !== "number" || input.montantRecu <= 0) {
            throw AppError.badRequest("Montant reçu requis pour un paiement négocié en espèces");
          }
          const montantRecu = new Prisma.Decimal(input.montantRecu);

          if (montantRecu.lt(prixNegocie)) {
            throw AppError.badRequest(
              `Montant reçu (${montantRecu}) insuffisant pour couvrir le prix négocié (${prixNegocie})`
            );
          }
          const monnaieARendre = montantRecu.sub(prixNegocie);

          await decrementStockAndLogMovements(tx, input.items, reference, sellerId);

          const sale = await tx.sale.create({
            data: {
              reference,
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              sellerId,
              paymentMethod: "NEGOCIE",
              subtotal,
              discount,
              total: prixNegocie,
              prixOriginal,
              prixNegocie,
              montantRecu,
              monnaieARendre,
              status: SaleStatus.PAID,
              negotiatedPaymentMethod: "ESPECES",
              items: { create: preparedItems },
            },
            include: { items: true, seller: { select: { id: true, nom: true, email: true } } },
          });

          await logAudit({
            userId: sellerId,
            action: "CREATE_SALE_NEGOTIATED",
            entity: "Sale",
            entityId: sale.id,
            meta: {
              reference,
              prixOriginal: prixOriginal.toString(),
              prixNegocie: prixNegocie.toString(),
            },
          });

          // Envoi au vendeur (best-effort)
          if (sale.seller?.email) {
            emailService.sendSaleConfirmationToSeller(sale as any, sale.seller.email).catch((err) => {
              console.error('Échec de l\'envoi de l\'email au vendeur :', err);
            });
          }

          return sale;
        }

        // negotiatedMethod === 'PAYDUNYA' : créer une facture PayDunya pour le montant négocié
        const pdResp = await paydunyaClient.createInvoice({
          amount: Math.round(prixNegocie.toNumber()),
          description: `Vente ${reference} (négociée)`,
          callbackUrl: env.paydunya.ipnUrl,
          cancelUrl: env.paydunya.cancelUrl,
          returnUrl: env.paydunya.successUrl,
        });

        const invoiceUrl = pdResp.invoiceUrl;
        const token = pdResp.token;
        const qrDataUrl = invoiceUrl ? await qrCodeService.generateDataUrl(invoiceUrl) : null;

        const sale = await tx.sale.create({
          data: {
            reference,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            sellerId,
            paymentMethod: "NEGOCIE",
            subtotal,
            discount,
            total: prixNegocie,
            prixOriginal,
            prixNegocie,
            negotiatedPaymentMethod: "PAYDUNYA",
            paydunyaReference: token,
            paydunyaInvoiceUrl: invoiceUrl,
            paydunyaQrCodeData: qrDataUrl,
            status: SaleStatus.PENDING,
            items: { create: preparedItems },
          },
          include: { items: true, seller: { select: { id: true, nom: true, email: true } } },
        });

        await logAudit({
          userId: sellerId,
          action: "CREATE_SALE_NEGOTIATED_PAYDUNYA_PENDING",
          entity: "Sale",
          entityId: sale.id,
          meta: { reference, total: prixNegocie.toString() },
        });

        return sale;
      }

      // --- Cas PAYDUNYA ---
      // Le stock N'EST PAS décompté ici : la vente est en attente de paiement.
      // Le décompte aura lieu lors de la confirmation côté IPN/confirm.
      const pdResp = await paydunyaClient.createInvoice({
        amount: Math.round(total.toNumber()),
        description: `Vente ${reference}`,
        callbackUrl: env.paydunya.ipnUrl,
        cancelUrl: env.paydunya.cancelUrl,
        returnUrl: env.paydunya.successUrl,
      });

      const invoiceUrl = pdResp.invoiceUrl;
      const token = pdResp.token;
      const qrDataUrl = invoiceUrl ? await qrCodeService.generateDataUrl(invoiceUrl) : null;

      const sale = await tx.sale.create({
        data: {
          reference,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          sellerId,
          paymentMethod: "PAYDUNYA",
          subtotal,
          discount,
          total,
          paydunyaReference: token,
          paydunyaInvoiceUrl: invoiceUrl,
          paydunyaQrCodeData: qrDataUrl,
          status: SaleStatus.PENDING,
          items: { create: preparedItems },
        },
        include: { items: true },
      });

      await logAudit({
        userId: sellerId,
        action: "CREATE_SALE_PAYDUNYA_PENDING",
        entity: "Sale",
        entityId: sale.id,
        meta: { reference, total: total.toString() },
      });

      return sale;
    });
  },

  async getById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, seller: { select: { id: true, nom: true } } },
    });
    if (!sale) throw AppError.notFound("Vente introuvable");
    return sale;
  },

  async getByReference(reference: string) {
    const sale = await prisma.sale.findUnique({
      where: { reference },
      include: { items: true, seller: { select: { id: true, nom: true } } },
    });
    if (!sale) throw AppError.notFound("Vente introuvable");
    return sale;
  },

  async listForSeller(sellerId: string) {
    return prisma.sale.findMany({
      where: { sellerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async listAll(filters: { status?: string; from?: string; to?: string }) {
    return prisma.sale.findMany({
      where: {
        ...(filters.status ? { status: filters.status as SaleStatus } : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      include: { items: true, seller: { select: { id: true, nom: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
