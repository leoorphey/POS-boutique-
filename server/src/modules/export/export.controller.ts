import { Request, Response } from "express";
import { excelService, ExportPeriod } from "@/services/excel.service";
import { catchAsync } from "@/utils/catchAsync";
import { AppError } from "@/utils/AppError";

const VALID_PERIODS: ExportPeriod[] = ["daily", "weekly", "monthly", "yearly"];

function parsePeriod(value: unknown): ExportPeriod {
  if (typeof value !== "string" || !VALID_PERIODS.includes(value as ExportPeriod)) {
    throw AppError.badRequest(
      `Période invalide. Valeurs acceptées : ${VALID_PERIODS.join(", ")}`
    );
  }
  return value as ExportPeriod;
}

export const exportController = {
  xlsx: catchAsync(async (req: Request, res: Response) => {
    const period = parsePeriod(req.query.period);
    const sales = await excelService.getSalesForPeriod(period);
    const buffer = await excelService.generateXlsx(sales);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="ventes-${period}.xlsx"`);
    res.send(buffer);
  }),

  csv: catchAsync(async (req: Request, res: Response) => {
    const period = parsePeriod(req.query.period);
    const sales = await excelService.getSalesForPeriod(period);
    const csv = excelService.generateCsv(sales);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ventes-${period}.csv"`);
    // BOM UTF-8 pour qu'Excel affiche correctement les accents à l'ouverture.
    res.send("\uFEFF" + csv);
  }),
};
