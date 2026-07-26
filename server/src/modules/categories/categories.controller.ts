import { Request, Response } from "express";
import { categoriesService } from "@/modules/categories/categories.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/response";

export const categoriesController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const categories = await categoriesService.list();
    sendSuccess(res, categories);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const category = await categoriesService.getById(req.params.id);
    sendSuccess(res, category);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const category = await categoriesService.create(req.body);
    sendCreated(res, category);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const category = await categoriesService.update(req.params.id, req.body);
    sendSuccess(res, category);
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    await categoriesService.remove(req.params.id);
    sendSuccess(res, { message: "Catégorie supprimée avec succès" });
  }),
};
