import { NextFunction, Request, Response } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// Capture automatiquement les rejets de promesses et les transmet
// au middleware d'erreur centralisé, sans try/catch dans chaque controller.
export function catchAsync(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
