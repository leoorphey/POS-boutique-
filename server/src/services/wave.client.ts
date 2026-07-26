import axios from "axios";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";

interface CreateCheckoutSessionParams {
  amount: number; // entier en FCFA, pas de décimales
  clientReference: string; // notre référence de vente, retrouvée dans le webhook
  successUrl: string;
  errorUrl: string;
}

interface CheckoutSession {
  id: string;
  wave_launch_url: string;
  amount: string;
  currency: string;
  checkout_status: string;
}

const waveHttp = axios.create({
  baseURL: env.wave.apiBaseUrl,
  headers: {
    Authorization: `Bearer ${env.wave.apiKey}`,
    "Content-Type": "application/json",
  },
});

export const waveClient = {
  // Documentation officielle : POST /v1/checkout/sessions (docs.wave.com/checkout).
  // Wave attend des entiers (pas de décimales) pour le montant en FCFA.
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
    if (!env.wave.apiKey) {
      throw AppError.internal(
        "WAVE_API_KEY non configurée : impossible de créer une session de paiement Wave"
      );
    }
    try {
      const { data } = await waveHttp.post<CheckoutSession>("/checkout/sessions", {
        amount: String(Math.round(params.amount)),
        currency: "XOF",
        client_reference: params.clientReference,
        success_url: params.successUrl,
        error_url: params.errorUrl,
      });
      return data;
    } catch (err) {
      console.error("Erreur lors de la création de la session Wave:", err);
      throw AppError.internal("Impossible de créer la session de paiement Wave");
    }
  },
};
