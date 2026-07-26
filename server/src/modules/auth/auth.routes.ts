import { Router } from "express";
import { authController } from "@/modules/auth/auth.controller";
import { authenticate } from "@/middlewares/authenticate";
import { validate } from "@/middlewares/validate";
import { loginRateLimiter } from "@/middlewares/rateLimiters";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
} from "@pos/shared";

const router = Router();

router.post("/login", loginRateLimiter, validate(loginSchema), authController.login);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post(
  "/reset-password/:token",
  validate(resetPasswordTokenSchema, "params"),
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export { router as authRouter };
