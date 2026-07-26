import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://127.0.0.1:3001",
  frontendUrl: process.env.FRONTEND_URL ?? "http://127.0.0.1:3001",

  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshSecret: required("JWT_REFRESH_SECRET"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },

  wave: {
    apiKey: process.env.WAVE_API_KEY ?? "",
    apiBaseUrl: process.env.WAVE_API_BASE_URL ?? "https://api.wave.com/v1",
    webhookSecret: process.env.WAVE_WEBHOOK_SECRET ?? "",
    successUrl: process.env.WAVE_SUCCESS_URL ?? "http://localhost:5173/pos/wave/success",
    errorUrl: process.env.WAVE_ERROR_URL ?? "http://localhost:5173/pos/wave/error",
  },

  paydunya: {
    masterKey: process.env.PAYDUNYA_MASTER_KEY ?? "",
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY ?? "",
    publicKey: process.env.PAYDUNYA_PUBLIC_KEY ?? "",
    token: process.env.PAYDUNYA_TOKEN ?? "",
    mode: process.env.PAYDUNYA_MODE ?? "sandbox",
    successUrl: process.env.PAYDUNYA_SUCCESS_URL ?? "http://localhost:5173/pos/paydunya/success",
    cancelUrl: process.env.PAYDUNYA_CANCEL_URL ?? "http://localhost:5173/pos/paydunya/cancel",
    ipnUrl: process.env.PAYDUNYA_IPN_URL ?? "http://localhost:4000/api/v1/payments/paydunya/ipn",
  },

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "POS Boutique <no-reply@boutique.com>",
    ownerEmail: process.env.OWNER_EMAIL ?? "",
  },

  shop: {
    name: process.env.SHOP_NAME ?? "Boutique Informatique",
    address: process.env.SHOP_ADDRESS ?? "",
    phone: process.env.SHOP_PHONE ?? "",
  },

  isProduction: process.env.NODE_ENV === "production",
};
