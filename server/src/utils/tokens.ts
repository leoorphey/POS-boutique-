import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "@/config/env";
import { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
}

// On ne stocke jamais le refresh token brut en DB : seulement son hash.
// Ainsi, une fuite de la base ne permet pas de réutiliser les tokens directement.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Convertit une chaîne de durée type "7d" / "15m" en date d'expiration absolue.
export function expiresInToDate(durationStr: string): Date {
  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Format de durée invalide : ${durationStr}`);
  }
  const [, amountStr, unit] = match;
  const amount = Number(amountStr);
  const unitToMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + amount * unitToMs[unit]);
}
