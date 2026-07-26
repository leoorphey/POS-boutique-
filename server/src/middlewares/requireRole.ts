import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "@/utils/AppError";

// S'utilise après authenticate. Exemple : requireRole(Role.ADMIN)
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Accès réservé aux rôles : ${allowedRoles.join(", ")}`
        )
      );
    }
    next();
  };
}
