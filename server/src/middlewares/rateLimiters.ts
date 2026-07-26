import rateLimit from "express-rate-limit";

// Limite globale, large : protège contre les abus généraux sans gêner l'usage normal.
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard.",
  },
});

// Limite stricte sur le login : cible privilégiée du brute-force.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
});
