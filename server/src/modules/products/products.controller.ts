import { Request, Response } from "express";
import { productsService } from "@/modules/products/products.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/response";

export const productsController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const result = await productsService.list(req.query as never);
    sendSuccess(res, result.items, 200, { pagination: result.pagination });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await productsService.getById(req.params.id));
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    sendCreated(res, await productsService.create(req.body, req.user!.id));
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await productsService.update(req.params.id, req.body));
  }),

  deactivate: catchAsync(async (req: Request, res: Response) => {
    await productsService.deactivate(req.params.id);
    sendSuccess(res, { message: "Produit désactivé du catalogue" });
  }),

  adjustStock: catchAsync(async (req: Request, res: Response) => {
    const { quantity, reason } = req.body;
    sendSuccess(
      res,
      await productsService.adjustStock(req.params.id, quantity, reason, req.user!.id)
    );
  }),
};
