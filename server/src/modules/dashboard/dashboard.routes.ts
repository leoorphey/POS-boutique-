import { Router } from "express";
import { Role } from "@prisma/client";
import { dashboardController } from "@/modules/dashboard/dashboard.controller";
import { authenticate } from "@/middlewares/authenticate";
import { requireRole } from "@/middlewares/requireRole";

const router = Router();

// Le tableau de bord est réservé à l'admin (cahier des charges).
router.use(authenticate, requireRole(Role.ADMIN));

router.get("/overview", dashboardController.overview);
router.get("/sales-by-day", dashboardController.salesByDay);
router.get("/sales-by-month", dashboardController.salesByMonth);
router.get("/top-products", dashboardController.topProducts);
router.get("/top-categories", dashboardController.topCategories);

export { router as dashboardRouter };
