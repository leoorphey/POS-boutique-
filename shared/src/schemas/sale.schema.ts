import { z } from "zod";

export const saleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const createSaleBaseSchema = z.object({
  customerName: z.string().max(150).optional(),
  customerPhone: z.string().max(30).optional(),
  items: z.array(saleItemInputSchema).min(1, "Le panier ne peut pas être vide"),
  discount: z.coerce.number().min(0).default(0),
});

export const createCashSaleSchema = createSaleBaseSchema.extend({
  paymentMethod: z.literal("ESPECES"),
  montantRecu: z.coerce.number().positive("Le montant reçu doit être positif"),
});

export const createNegotiatedSaleSchema = createSaleBaseSchema.extend({
  paymentMethod: z.literal("NEGOCIE"),
  prixNegocie: z.coerce.number().positive("Le prix négocié doit être positif"),
  negotiatedPaymentMethod: z.enum(["ESPECES", "PAYDUNYA"]).default("ESPECES"),
  montantRecu: z.coerce.number().optional(),
});

export const createPaydunyaSaleSchema = createSaleBaseSchema.extend({
  paymentMethod: z.literal("PAYDUNYA"),
});

export const createSaleSchema = z.discriminatedUnion("paymentMethod", [
  createCashSaleSchema,
  createNegotiatedSaleSchema,
  createPaydunyaSaleSchema,
]).superRefine((data, ctx) => {
  if (
    data.paymentMethod === "NEGOCIE" &&
    data.negotiatedPaymentMethod === "ESPECES"
  ) {
    if (typeof data.montantRecu !== "number" || data.montantRecu <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Montant reçu requis pour paiement en espèces",
        path: ["montantRecu"],
      });
    }
  }
});

// Format réel de l'API Wave (confirmé via docs.wave.com/webhook) :
// { "id": "...", "type": "checkout.session.completed", "data": { "id", "amount",
//   "checkout_status", "client_reference", "currency", "payment_status", ... } }
export const waveWebhookSchema = z.object({
  id: z.string().optional(),
  type: z.string(), // ex: "checkout.session.completed"
  data: z.object({
    id: z.string(), // identifiant de session Wave (cos-...)
    amount: z.union([z.string(), z.number()]),
    checkout_status: z.string().optional(),
    payment_status: z.string().optional(), // "succeeded" | autre
    client_reference: z.string().nullable().optional(), // on y stocke notre référence de vente
    currency: z.string().optional(),
  }),
});

export const saleIdParamSchema = z.object({
  id: z.string().min(1),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type WaveWebhookInput = z.infer<typeof waveWebhookSchema>;
