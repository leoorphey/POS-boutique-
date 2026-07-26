import { Request, Response } from "express";
import { authService } from "@/modules/auth/auth.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/response";
import { AppError } from "@/utils/AppError";

export const authController = {
  login: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result);
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result);
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw AppError.badRequest("refreshToken requis");
    }
    await authService.logout(refreshToken);
    sendSuccess(res, { message: "Déconnecté avec succès" });
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result);
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.params.token, req.body.password);
    sendSuccess(res, result);
  }),

  me: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.me(req.user!.id);
    sendSuccess(res, result);
  }),
};
