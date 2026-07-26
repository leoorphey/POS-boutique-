import axios from 'axios';
import { env } from '@/config/env';

const SANDBOX_BASE = 'https://app.paydunya.com/sandbox-api/v1';
const LIVE_BASE = 'https://app.paydunya.com/api/v1';

const MASTER_KEY = env.paydunya.masterKey;
const PRIVATE_KEY = env.paydunya.privateKey;
const PUBLIC_KEY = env.paydunya.publicKey;
const TOKEN = env.paydunya.token;

export interface CreateInvoiceParams {
  amount: number; // en la plus petite unité (ex: CFA françafricaine -> 1 unité)
  description?: string;
  callbackUrl?: string;
  cancelUrl?: string;
  returnUrl?: string;
}

interface NormalizedPaydunyaResponse {
  responseCode?: string;
  responseText?: string;
  token?: string;
  invoiceUrl?: string;
  state?: string;
  status?: string;
  raw: unknown;
}

function normalizePaydunyaResponse(payload: unknown): NormalizedPaydunyaResponse {
  const raw = (payload as any)?.response ?? payload;
  const responseCode = raw?.response_code ?? raw?.responseCode ?? raw?.code;
  const responseText = raw?.response_text ?? raw?.responseText ?? raw?.message ?? raw?.text;
  const token = raw?.token ?? raw?.invoice_token ?? raw?.invoiceToken;
  const invoiceUrl = raw?.invoice_url ?? raw?.checkout_url ?? raw?.invoice?.invoice_url ?? raw?.invoice?.checkout_url ?? raw?.data?.invoice_url ?? raw?.data?.checkout_url ?? (typeof responseText === 'string' && /^https?:\/\//.test(responseText) ? responseText : undefined);
  const state = raw?.state ?? raw?.status ?? raw?.payment_status;

  return {
    responseCode,
    responseText,
    token,
    invoiceUrl,
    state,
    status: raw?.status,
    raw: payload,
  };
}

export async function createInvoice(params: CreateInvoiceParams): Promise<NormalizedPaydunyaResponse> {
  const base = env.paydunya.mode === 'live' ? LIVE_BASE : SANDBOX_BASE;
  const url = `${base}/checkout-invoice/create`;
  const amount = Number.isFinite(params.amount) ? Math.round(params.amount) : 0;
  const body = {
    invoice: {
      total_amount: amount,
      description: params.description ?? 'Paiement',
      callback_url: params.callbackUrl,
      cancel_url: params.cancelUrl,
      return_url: params.returnUrl,
    },
    store: {
      name: env.shop.name,
      postal_address: env.shop.address,
      phone_number: env.shop.phone,
      website_url: env.frontendUrl,
    },
  };

  // Temporary debug log for PayDunya diagnostics; remove later if not needed.
  console.info('[PayDunya] createInvoice request', { url, keysPresent: { master_key: !!MASTER_KEY, private_key: !!PRIVATE_KEY, public_key: !!PUBLIC_KEY, token: !!TOKEN } });

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-PUBLIC-KEY': PUBLIC_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
      },
      validateStatus: () => true,
    });

    console.info('[PayDunya] createInvoice response', { status: response.status, data: response.data });

    const normalized = normalizePaydunyaResponse(response.data);
    if (normalized.responseCode !== '00') {
      throw new Error(
        `PayDunya invoice creation failed: ${normalized.responseText ?? 'Réponse invalide'} (${normalized.responseCode ?? response.status})`
      );
    }

    if (!normalized.token || !normalized.invoiceUrl) {
      throw new Error('PayDunya invoice creation succeeded but returned no token or checkout URL');
    }

    return normalized;
  } catch (error) {
    console.error('[PayDunya] createInvoice error', error);
    throw error;
  }
}

export async function confirmInvoice(token: string): Promise<NormalizedPaydunyaResponse> {
  const base = env.paydunya.mode === 'live' ? LIVE_BASE : SANDBOX_BASE;
  const url = `${base}/checkout-invoice/confirm/${encodeURIComponent(token)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-PUBLIC-KEY': PUBLIC_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
      },
      validateStatus: () => true,
    });

    console.info('[PayDunya] confirmInvoice response', { status: response.status, data: response.data });
    return normalizePaydunyaResponse(response.data);
  } catch (error) {
    console.error('[PayDunya] confirmInvoice error', error);
    throw error;
  }
}

export function verifyHash(hash: string) {
  // PayDunya hash policy: SHA-512(PAYDUNYA_MASTER_KEY)
  const crypto = require('crypto');
  const expected = crypto.createHash('sha512').update(MASTER_KEY).digest('hex');
  return expected === hash;
}
