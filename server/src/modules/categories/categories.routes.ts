import { Router } from "express";
import { Role } from "@prisma/client";
import { categoriesController } from "@/modules/categories/categories.controller";
import { authenticate } from "@/middlewares/authenticate";
import { requireRole } from "@/middlewares/requireRole";
import { validate } from "@/middlewares/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "@pos/shared";

const router = Router();

// Toutes les routes catégories nécessitent d'être authentifié.
router.use(authenticate);

// Lecture : Admin + Vendeur (le vendeur doit voir le catalogue par catégorie au POS)
router.get("/", categoriesController.list);
router.get(
  "/:id",
  validate(categoryIdParamSchema, "params"),
  categoriesController.getById
);

// Écriture : Admin uniquement (gestion des catégories réservée à l'admin)
router.post(
  "/",
  requireRole(Role.ADMIN),
  validate(createCategorySchema),
  categoriesController.create
);

router.patch(
  "/:id",
  requireRole(Role.ADMIN),
  validate(categoryIdParamSchema, "params"),
  validate(updateCategorySchema),
  categoriesController.update
);

router.delete(
  "/:id",
  requireRole(Role.ADMIN),
  validate(categoryIdParamSchema, "params"),
  categoriesController.remove
);

export { router as categoriesRouter };
