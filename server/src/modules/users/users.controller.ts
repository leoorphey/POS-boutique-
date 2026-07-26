import { Request, Response } from "express";
import { usersService } from "@/modules/users/users.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/response";

export const usersController = {
  list: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await usersService.list());
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await usersService.getById(req.params.id));
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    sendCreated(res, await usersService.create(req.body));
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await usersService.update(req.params.id, req.body));
  }),

  deactivate: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await usersService.deactivate(req.params.id));
  }),
};
