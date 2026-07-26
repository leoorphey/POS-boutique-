import { Router } from "express";

const router = Router();

// Les webhooks spécifiques (ex: PayDunya IPN) sont montés séparément.
// Ce router contient les endpoints payments normaux protégés.

export { router as paymentsRouter };
