import { Request, Response } from "express";
import { dashboardService } from "@/modules/dashboard/dashboard.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/response";

export const dashboardController = {
  overview: catchAsync(async (req: Request, res: Response) => {
    const [today, monthly, stock] = await Promise.all([
      dashboardService.getTodayStats(),
      dashboardService.getMonthlyStats(),
      dashboardService.getStockOverview(),
    ]);
    sendSuccess(res, { today, monthly, stock });
  }),

  salesByDay: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getSalesByDay());
  }),

  salesByMonth: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getSalesByMonth());
  }),

  topProducts: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getTopProducts());
  }),

  topCategories: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await dashboardService.getTopCategories());
  }),
};
