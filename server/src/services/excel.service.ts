import ExcelJS from "exceljs";
import { prisma } from "@/config/prisma";
import { Sale, SaleItem } from "@prisma/client";

export type ExportPeriod = "daily" | "weekly" | "monthly" | "yearly";

function getDateRange(period: ExportPeriod): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from: Date;

  switch (period) {
    case "daily":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "weekly": {
      const dayOfWeek = now.getDay() || 7; // dimanche -> 7, pour démarrer la semaine au lundi
      from = new Date(now);
      from.setDate(now.getDate() - dayOfWeek + 1);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "monthly":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      from = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { from, to };
}

interface SaleWithRelations extends Sale {
  items: SaleItem[];
  seller: { nom: string };
}

const HEADERS = [
  "Date",
  "Client",
  "Produit",
  "IMEI",
  "Numéro Série",
  "Quantité",
  "Prix Unitaire",
  "Total",
  "Paiement",
  "Vendeur",
];

function flattenSalesToRows(sales: SaleWithRelations[]) {
  const rows: (string | number)[][] = [];
  for (const sale of sales) {
    for (const item of sale.items) {
      rows.push([
        sale.createdAt.toLocaleDateString("fr-FR"),
        sale.customerName ?? "—",
        `${item.productBrand} ${item.productName}`,
        item.imei ?? "—",
        item.serialNumber ?? "—",
        item.quantity,
        Number(item.unitPrice),
        Number(item.total),
        sale.paymentMethod,
        sale.seller.nom,
      ]);
    }
  }
  return rows;
}

export const excelService = {
  async getSalesForPeriod(period: ExportPeriod): Promise<SaleWithRelations[]> {
    const { from, to } = getDateRange(period);
    return prisma.sale.findMany({
      where: { status: "PAID", createdAt: { gte: from, lte: to } },
      include: { items: true, seller: { select: { nom: true } } },
      orderBy: { createdAt: "asc" },
    }) as unknown as Promise<SaleWithRelations[]>;
  },

  async generateXlsx(sales: SaleWithRelations[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ventes");

    sheet.addRow(HEADERS);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    const rows = flattenSalesToRows(sales);
    rows.forEach((row) => sheet.addRow(row));

    sheet.columns.forEach((col) => {
      col.width = 18;
    });
    sheet.getColumn(7).numFmt = "#,##0";
    sheet.getColumn(8).numFmt = "#,##0";

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  generateCsv(sales: SaleWithRelations[]): string {
    const rows = flattenSalesToRows(sales);
    const escape = (value: string | number) => {
      const str = String(value);
      return str.includes(",") || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const lines = [HEADERS.join(","), ...rows.map((row) => row.map(escape).join(","))];
    return lines.join("\n");
  },
};
