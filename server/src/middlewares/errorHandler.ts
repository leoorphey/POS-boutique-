import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // 1. Erreurs applicatives connues
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // 2. Erreurs de validation Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      details: err.flatten().fieldErrors,
    });
  }

  // 3. Erreurs Prisma connues (contrainte unique, clé étrangère, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Une ressource avec ces informations existe déjà",
        details: err.meta,
      });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Cette opération viole une contrainte de relation (ressource liée)",
        details: err.meta,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Ressource introuvable",
      });
    }
  }

  // 4. Erreur inattendue : log complet en interne, message générique au client
  console.error("Erreur non gérée:", err);
  return res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
    ...(env.isProduction ? {} : { stack: (err as Error)?.stack }),
  });
}
