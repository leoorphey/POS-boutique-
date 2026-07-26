import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { productsController } from "@/modules/products/products.controller";
import { authenticate } from "@/middlewares/authenticate";
import { requireRole } from "@/middlewares/requireRole";
import { validate } from "@/middlewares/validate";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdParamSchema,
} from "@pos/shared";

const adjustStockSchema = z.object({
  quantity: z.coerce.number().int(),
  reason: z.string().min(1),
});

const router = Router();

router.use(authenticate);

router.get("/", validate(productQuerySchema, "query"), productsController.list);
router.get("/:id", validate(productIdParamSchema, "params"), productsController.getById);

router.post(
  "/",
  requireRole(Role.ADMIN),
  validate(createProductSchema),
  productsController.create
);

router.patch(
  "/:id",
  requireRole(Role.ADMIN),
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema),
  productsController.update
);

router.delete(
  "/:id",
  requireRole(Role.ADMIN),
  validate(productIdParamSchema, "params"),
  productsController.deactivate
);

router.post(
  "/:id/stock",
  requireRole(Role.ADMIN),
  validate(productIdParamSchema, "params"),
  validate(adjustStockSchema),
  productsController.adjustStock
);

export { router as productsRouter };
