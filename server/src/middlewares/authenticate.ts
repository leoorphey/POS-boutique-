import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: AuthenticatedUser["role"];
}

// Vérifie le JWT d'accès envoyé dans l'en-tête Authorization: Bearer <token>.
// La logique de génération des tokens (login, refresh, rotation) est développée
// en Phase 5 (module auth) ; ce middleware ne fait que la vérification.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Token d'authentification manquant"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return next(AppError.unauthorized("Token invalide ou expiré"));
  }
}
