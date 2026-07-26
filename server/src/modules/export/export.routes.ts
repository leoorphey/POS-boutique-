import { Router } from "express";
import { Role } from "@prisma/client";
import { exportController } from "@/modules/export/export.controller";
import { authenticate } from "@/middlewares/authenticate";
import { requireRole } from "@/middlewares/requireRole";

const router = Router();

// Export réservé à l'admin (cahier des charges : "exporter les données" est une
// capacité administrateur).
router.use(authenticate, requireRole(Role.ADMIN));

router.get("/sales.xlsx", exportController.xlsx);
router.get("/sales.csv", exportController.csv);

export { router as exportRouter };
