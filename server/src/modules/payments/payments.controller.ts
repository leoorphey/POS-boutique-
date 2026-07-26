import { Request, Response } from "express";
import crypto from "crypto";
import { env } from "@/config/env";
import { paymentsService } from "@/modules/payments/payments.service";
import { catchAsync } from "@/utils/catchAsync";
import { AppError } from "@/utils/AppError";
import { waveWebhookSchema } from "@pos/shared";

// Vérification de signature conforme à la documentation officielle Wave
// (docs.wave.com/webhook, confirmé en Phase 7).
//
// Format de l'en-tête : "Wave-Signature: t=<timestamp_unix>,v1=<hmac_hex>"
// Le HMAC-SHA256 est calculé sur la CONCATÉNATION "timestamp + corps brut",
// avec le signing secret comme clé. Toute déformation du corps brut
// (re-parsing JSON + re-stringify, espace ajouté, ordre des clés changé)
// invalide la signature : d'où l'usage de express.raw() dans app.ts.
function verifyWaveSignature(rawBody: Buffer, header: string | undefined): boolean {
  if (!env.wave.webhookSecret) {
    console.warn("WAVE_WEBHOOK_SECRET non configuré : signature non vérifiée (dev uniquement)");
    return true;
  }
  if (!header) return false;

  // Le header a la forme "t=1639081943,v1=942119aedf9fa377844cf010785fe14ef..."
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const payload = timestamp + rawBody.toString("utf-8");
  const expected = crypto
    .createHmac("sha256", env.wave.webhookSecret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    // Les deux chaînes n'ont pas la même longueur -> timingSafeEqual lève une exception.
    return false;
  }
}

export const paymentsController = {
  waveWebhook: catchAsync(async (req: Request, res: Response) => {
    const signatureHeader = req.headers["wave-signature"] as string | undefined;
    const rawBody = req.body as Buffer; // express.raw() sur cette route, voir app.ts

    if (!verifyWaveSignature(rawBody, signatureHeader)) {
      throw AppError.unauthorized("Signature de webhook invalide");
    }

    const parsed = waveWebhookSchema.parse(JSON.parse(rawBody.toString("utf-8")));

    if (parsed.type === "checkout.session.completed") {
      // client_reference doit avoir été renseigné avec notre référence de vente
      // au moment de la création de la session Wave (à faire lors de l'appel
      // POST /v1/checkout/sessions, en Phase 7 — voir note dans sales.service.ts).
      const ourReference = parsed.data.client_reference;
      const status = parsed.data.payment_status === "succeeded" ? "success" : "failed";

      if (ourReference) {
        await paymentsService.confirmWavePayment(ourReference, status);
      } else {
        console.warn("Webhook Wave reçu sans client_reference :", parsed.data.id);
      }
    }

    // Toujours répondre 200 rapidement : Wave réessaie sinon (jusqu'à 5 fois avec
    // backoff sur 24h), ce qui est sans danger ici car confirmWavePayment est idempotent.
    res.status(200).json({ received: true });
  }),
};
