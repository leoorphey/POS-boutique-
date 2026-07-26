import { Router } from "express";
import { salesController } from "@/modules/sales/sales.controller";
import { authenticate } from "@/middlewares/authenticate";
import { validate } from "@/middlewares/validate";
import { createSaleSchema, saleIdParamSchema } from "@pos/shared";

const router = Router();

router.use(authenticate);

router.get("/", salesController.list);
router.get("/:id", validate(saleIdParamSchema, "params"), salesController.getById);
router.get(
  "/:id/receipt",
  validate(saleIdParamSchema, "params"),
  salesController.downloadReceipt
);
router.post(
  "/:id/receipt/email",
  validate(saleIdParamSchema, "params"),
  salesController.emailReceipt
);
router.post("/", validate(createSaleSchema), salesController.create);

export { router as salesRouter };
