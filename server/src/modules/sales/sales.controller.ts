import { Request, Response } from "express";
import { salesService } from "@/modules/sales/sales.service";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/response";
import { Role } from "@prisma/client";
import { pdfService } from "@/services/pdf.service";
import { emailService } from "@/services/email.service";
import { AppError } from "@/utils/AppError";

export const salesController = {
  create: catchAsync(async (req: Request, res: Response) => {
    sendCreated(res, await salesService.create(req.body, req.user!.id));
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await salesService.getById(req.params.id));
  }),

  // Un vendeur ne voit que ses propres ventes ; un admin voit tout.
  list: catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role === Role.ADMIN) {
      sendSuccess(res, await salesService.listAll(req.query as never));
    } else {
      sendSuccess(res, await salesService.listForSeller(req.user!.id));
    }
  }),

  downloadReceipt: catchAsync(async (req: Request, res: Response) => {
    const sale = await salesService.getById(req.params.id);
    const pdfBuffer = await pdfService.generateReceipt(sale);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="recu-${sale.reference}.pdf"`
    );
    res.send(pdfBuffer);
  }),

  emailReceipt: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw AppError.badRequest("Adresse email requise");

    const sale = await salesService.getById(req.params.id);
    const pdfBuffer = await pdfService.generateReceipt(sale);
    await emailService.sendReceiptToCustomer(sale, email, pdfBuffer);

    sendSuccess(res, { message: "Reçu envoyé par email" });
  }),
};
