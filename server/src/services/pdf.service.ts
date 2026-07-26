import PDFDocument from "pdfkit";
import { Sale, SaleItem, User } from "@prisma/client";
import { env } from "@/config/env";
import { PassThrough } from "stream";

type SaleWithRelations = Sale & {
  items: SaleItem[];
  seller?: Pick<User, "nom"> | null;
};

function formatFcfa(amount: unknown): string {
  return `${Number(amount).toLocaleString("fr-FR")} FCFA`;
}

const PAYMENT_LABELS: Record<string, string> = {
  PAYDUNYA: "PayDunya",
  ESPECES: "Espèces",
  NEGOCIE: "Prix négocié",
};

export const pdfService = {
  // Génère le reçu PDF en mémoire et retourne un Buffer, prêt à être envoyé
  // en réponse HTTP (téléchargement) ou en pièce jointe d'email.
  async generateReceipt(sale: SaleWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A5", margin: 40 });
      const stream = new PassThrough();
      const chunks: Buffer[] = [];

      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
      doc.pipe(stream);

      // --- En-tête boutique ---
      doc.fontSize(16).font("Helvetica-Bold").text(env.shop.name, { align: "center" });
      if (env.shop.address) {
        doc.fontSize(9).font("Helvetica").text(env.shop.address, { align: "center" });
      }
      if (env.shop.phone) {
        doc.fontSize(9).text(env.shop.phone, { align: "center" });
      }
      doc.moveDown(1);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(0.8);

      // --- Informations de la vente ---
      doc.fontSize(11).font("Helvetica-Bold").text(`Reçu — ${sale.reference}`);
      doc.fontSize(9).font("Helvetica");
      doc.text(`Date : ${sale.createdAt.toLocaleString("fr-FR")}`);
      if (sale.seller?.nom) {
        doc.text(`Vendeur : ${sale.seller.nom}`);
      }
      if (sale.customerName) {
        doc.text(`Client : ${sale.customerName}`);
      }
      doc.text(`Paiement : ${PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}`);
      doc.moveDown(0.8);

      // --- Tableau des articles ---
      const colX = { product: doc.page.margins.left, qty: 280, price: 320, total: 400 };
      doc.font("Helvetica-Bold").fontSize(8);
      doc.text("Article", colX.product, doc.y, { continued: false });
      doc.text("Qté", colX.qty, doc.y - doc.currentLineHeight(), { width: 30 });
      doc.text("Prix", colX.price, doc.y - doc.currentLineHeight(), { width: 60 });
      doc.moveDown(0.3);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(0.3);

      doc.font("Helvetica").fontSize(8);
      for (const item of sale.items) {
        const lineY = doc.y;
        doc.text(`${item.productBrand} ${item.productName}`, colX.product, lineY, {
          width: 230,
        });
        const subLines: string[] = [];
        if (item.imei) subLines.push(`IMEI: ${item.imei}`);
        if (item.serialNumber) subLines.push(`SN: ${item.serialNumber}`);
        if (subLines.length) {
          doc.fontSize(7).fillColor("#666666").text(subLines.join(" · "), colX.product, doc.y, {
            width: 230,
          });
          doc.fillColor("#000000").fontSize(8);
        }
        doc.text(String(item.quantity), colX.qty, lineY, { width: 30 });
        doc.text(formatFcfa(item.total), colX.price, lineY, { width: 100 });
        doc.moveDown(0.5);
      }

      doc.moveDown(0.3);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(0.5);

      // --- Totaux ---
      doc.font("Helvetica").fontSize(9);
      doc.text(`Sous-total : ${formatFcfa(sale.subtotal)}`, { align: "right" });
      if (Number(sale.discount) > 0) {
        doc.text(`Remise : -${formatFcfa(sale.discount)}`, { align: "right" });
      }
      doc.font("Helvetica-Bold").fontSize(12);
      doc.text(`Total : ${formatFcfa(sale.total)}`, { align: "right" });

      if (sale.montantRecu) {
        doc.font("Helvetica").fontSize(9).moveDown(0.3);
        doc.text(`Montant reçu : ${formatFcfa(sale.montantRecu)}`, { align: "right" });
        if (sale.monnaieARendre) {
          doc.text(`Monnaie rendue : ${formatFcfa(sale.monnaieARendre)}`, { align: "right" });
        }
      }

      doc.moveDown(1.5);
      doc
        .fontSize(8)
        .fillColor("#666666")
        .text("Merci pour votre achat !", { align: "center" });

      doc.end();
    });
  },
};
