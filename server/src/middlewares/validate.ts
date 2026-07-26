import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type ValidationTarget = "body" | "query" | "params";

// Valide req[target] avec le schéma Zod fourni, et REMPLACE req[target]
// par la version parsée (donc transformée/typée) pour que les controllers
// reçoivent des données déjà nettoyées (ex: coercion de string -> number).
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.parse(req[target]);
    req[target] = result;
    next();
  };
}
