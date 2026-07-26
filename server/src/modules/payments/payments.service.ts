import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { SaleStatus, StockMovementType } from "@prisma/client";
import { logAudit } from "@/utils/auditLog";
import { emailService } from "@/services/email.service";

export const paymentsService = {
  // Appelé par le webhook Wave, avec le client_reference qu'on a fourni
  // nous-mêmes à la création de la session Wave Checkout (= notre Sale.reference,
  // pas le session.id Wave qui est stocké séparément dans Sale.waveReference).
  // Idempotent : si la vente est déjà PAID/FAILED, on ne rejoue pas le décompte
  // de stock (un webhook peut être livré plusieurs fois, Wave retente jusqu'à 5 fois).
  async confirmWavePayment(ourReference: string, status: "success" | "failed") {
    const sale = await prisma.sale.findUnique({
      where: { reference: ourReference },
      include: { items: true },
    });

    if (!sale) {
      throw AppError.notFound(`Vente introuvable pour la référence ${ourReference}`);
    }

    if (sale.status !== SaleStatus.PENDING) {
      // Déjà traité (PAID ou FAILED) : on répond OK sans rejouer la logique,
      // pour que Wave ne reçoive jamais d'erreur sur un webhook dupliqué.
      return sale;
    }

    if (status === "failed") {
      const updated = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: SaleStatus.FAILED },
      });
      await logAudit({
        action: "WAVE_PAYMENT_FAILED",
        entity: "Sale",
        entityId: sale.id,
        meta: { reference: ourReference },
      });
      return updated;
    }

    // Paiement confirmé : décompte du stock + passage en PAID, dans une transaction.
    const updatedSale = await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, quantiteStock: { gte: item.quantity } },
          data: { quantiteStock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          // Le stock a changé entre la création de la vente PENDING et la confirmation
          // du paiement (ex: vendu entre-temps par un autre vendeur). Cas rare mais réel
          // pour les produits sérialisés à quantité 1.
          throw AppError.conflict(
            `Stock devenu insuffisant pour le produit ${item.productId} entre la création de la vente et la confirmation du paiement`
          );
        }
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.SORTIE,
            quantity: item.quantity,
            reason: `Vente ${sale.reference} (paiement Wave confirmé)`,
            userId: sale.sellerId,
          },
        });
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: { status: SaleStatus.PAID },
        include: { items: true, seller: { select: { nom: true } } },
      });
    });

    await logAudit({
      action: "WAVE_PAYMENT_CONFIRMED",
      entity: "Sale",
      entityId: sale.id,
      meta: { reference: ourReference, total: sale.total.toString() },
    });

    // Envoi de l'email au propriétaire, best-effort (ne bloque pas la réponse au webhook).
    emailService.sendSaleNotification(updatedSale).catch((err) => {
      console.error("Échec de l'envoi de l'email de notification de vente:", err);
    });

    return updatedSale;
  },

  async confirmPaydunyaPayment(token: string, status?: string) {
    const sale = await prisma.sale.findFirst({ where: { paydunyaReference: token }, include: { items: true } });

    if (!sale) {
      throw AppError.notFound(`Vente introuvable pour le token PayDunya ${token}`);
    }

    if (sale.status !== SaleStatus.PENDING) {
      return sale;
    }

    if (status && status.toLowerCase() === 'failed') {
      const updated = await prisma.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.FAILED } });
      await logAudit({ action: 'PAYDUNYA_PAYMENT_FAILED', entity: 'Sale', entityId: sale.id, meta: { token } });
      return updated;
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const result = await tx.product.updateMany({ where: { id: item.productId, quantiteStock: { gte: item.quantity } }, data: { quantiteStock: { decrement: item.quantity } } });
        if (result.count === 0) {
          throw AppError.conflict(`Stock devenu insuffisant pour le produit ${item.productId} entre la création de la vente et la confirmation du paiement`);
        }
        await tx.stockMovement.create({ data: { productId: item.productId, type: StockMovementType.SORTIE, quantity: item.quantity, reason: `Vente ${sale.reference} (paiement PayDunya confirmé)`, userId: sale.sellerId } });
      }

      return tx.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.PAID, paydunyaPaidAt: new Date() }, include: { items: true, seller: { select: { nom: true, email: true } } } });
    });

    await logAudit({ action: 'PAYDUNYA_PAYMENT_CONFIRMED', entity: 'Sale', entityId: sale.id, meta: { token, total: sale.total.toString() } });

    // Envoi email au propriétaire (best-effort)
    emailService.sendSaleNotification(updatedSale as any).catch((err) => {
      console.error("Échec de l'envoi de l'email de notification de vente (propriétaire):", err);
    });

    // Envoi email au vendeur (best-effort)
    if ((updatedSale as any).seller?.email) {
      emailService.sendSaleConfirmationToSeller(updatedSale as any, (updatedSale as any).seller.email).catch((err) => {
        console.error("Échec de l'envoi de l'email au vendeur :", err);
      });
    }

    return updatedSale;
  },
};
