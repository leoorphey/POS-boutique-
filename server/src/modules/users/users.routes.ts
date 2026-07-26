import { Router } from "express";
import { Role } from "@prisma/client";
import { usersController } from "@/modules/users/users.controller";
import { authenticate } from "@/middlewares/authenticate";
import { requireRole } from "@/middlewares/requireRole";
import { validate } from "@/middlewares/validate";
import { createUserSchema, updateUserSchema } from "@pos/shared";

const router = Router();

// Toute la gestion des utilisateurs est réservée à l'admin.
router.use(authenticate, requireRole(Role.ADMIN));

router.get("/", usersController.list);
router.get("/:id", usersController.getById);
router.post("/", validate(createUserSchema), usersController.create);
router.patch("/:id", validate(updateUserSchema), usersController.update);
router.delete("/:id", usersController.deactivate);

export { router as usersRouter };
