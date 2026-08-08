import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import { globalRateLimiter } from "@/middlewares/rateLimiters";
import { errorHandler } from "@/middlewares/errorHandler";
import { AppError } from "@/utils/AppError";
import { categoriesRouter } from "@/modules/categories/categories.routes";
import { authRouter } from "@/modules/auth/auth.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { productsRouter } from "@/modules/products/products.routes";
import { salesRouter } from "@/modules/sales/sales.routes";
import { paymentsRouter } from "@/modules/payments/payments.routes";
import paydunyaRouter from "@/modules/payments/paydunya.routes";
import { dashboardRouter } from "@/modules/dashboard/dashboard.routes";
import { exportRouter } from "@/modules/export/export.routes";

export function createApp(): Application {
  const app = express();
  app.set("trust proxy", 1);

  // Sécurité HTTP de base (en-têtes : X-Frame-Options, CSP basique, etc.)
  app.use(helmet());

  // CORS restreint à l'origine du frontend, pas un wildcard
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );

  // Logs des requêtes : format détaillé en prod, concis en dev
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(globalRateLimiter);

  app.get("/health", (req, res) => {
    res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Montage des routes métier ---
  app.use("/api/admin", authRouter);

  const apiRouter = express.Router();
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/users", usersRouter);
  apiRouter.use("/categories", categoriesRouter);
  apiRouter.use("/products", productsRouter);
  apiRouter.use("/sales", salesRouter);
  apiRouter.use("/payments", paymentsRouter); // routes payments restantes (hors webhook déjà monté ci-dessus)
  // Mount PayDunya IPN webhook (form-urlencoded)
  apiRouter.use("/payments/paydunya", paydunyaRouter);
  apiRouter.use("/dashboard", dashboardRouter);
  apiRouter.use("/export", exportRouter);

  app.use("/api/v1", apiRouter);

  // Route inconnue -> 404 propre géré par errorHandler
  app.use((req, res, next) => {
    next(AppError.notFound(`Route non trouvée : ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
}
