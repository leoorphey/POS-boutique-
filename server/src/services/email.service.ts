import { Resend } from "resend";
import { env } from "@/config/env";
import { Sale, SaleItem, Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";

const resendClient = new Resend(env.resend.apiKey);

type SaleWithItems = Sale & { items: SaleItem[]; seller?: { nom: string } | null };


function formatAmount(amount: Prisma.Decimal | number) {
  return `${Number(amount).toLocaleString("fr-FR")} FCFA`;
}

function assertSmtpConfigured() {
  if (!env.smtp.host || !env.smtp.from) {
    throw AppError.badRequest(
      "L'envoi d'email n'est pas configuré sur ce serveur. Vérifiez SMTP_HOST et EMAIL_FROM dans server/.env."
    );
  }
}

function escapeHtml(str: string | null | undefined) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const emailService = {
  // Notification au propriétaire après chaque vente validée.
  // Le template HTML complet (mise en page professionnelle) est développé en Phase 8 ;
  // cette version texte/HTML simple est fonctionnelle dès cette phase.
  async sendSaleNotification(sale: SaleWithItems) {
    if (!env.smtp.ownerEmail || !env.resend.apiKey) {
      console.warn("Email non envoyé : OWNER_EMAIL ou RESEND_API_KEY non configuré");
      return;
    }

    const itemsHtml = sale.items
      .map((item) => {
        const name = escapeHtml(item.productName) + " " + escapeHtml(item.productBrand);
        const imei = escapeHtml(item.imei ?? "—");
        const sn = escapeHtml(item.serialNumber ?? "—");
        return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${imei}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${sn}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${formatAmount(item.unitPrice)}</td>
        </tr>`;
      })
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nouvelle vente validée — ${sale.reference}</h2>
        <p><strong>Date :</strong> ${sale.createdAt.toLocaleString("fr-FR")}</p>
        <p><strong>Vendeur :</strong> ${escapeHtml(sale.seller?.nom ?? "—")}</p>
        <p><strong>Mode de paiement :</strong> ${escapeHtml(String(sale.paymentMethod))}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f4f4f5;text-align:left;">
              <th style="padding:8px;">Produit</th>
              <th style="padding:8px;">IMEI</th>
              <th style="padding:8px;">N° Série</th>
              <th style="padding:8px;">Qté</th>
              <th style="padding:8px;">Prix</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin-top:16px;font-size:18px;"><strong>Total : ${formatAmount(sale.total)}</strong></p>
      </div>
    `;

    try {
      await resendClient.emails.send({
        from: env.resend.from,
        to: env.smtp.ownerEmail,
        subject: `Nouvelle vente — ${sale.reference}`,
        html,
      });
    } catch (err) {
      console.error("Échec de l'envoi de l'email de notification de vente:", err);
    }
  },

  // Envoi d'une confirmation au vendeur ayant réalisé la vente
  async sendSaleConfirmationToSeller(sale: SaleWithItems, sellerEmail: string) {
    if (!sellerEmail || !env.resend.apiKey) {
      console.warn("Email vendeur non envoyé : email vendeur absent ou RESEND_API_KEY non configuré");
      return;
    }

    const itemsHtml = sale.items
      .map((item) => {
        const name = escapeHtml(item.productName) + " " + escapeHtml(item.productBrand);
        const imei = escapeHtml(item.imei ?? "—");
        const sn = escapeHtml(item.serialNumber ?? "—");
        return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${imei}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${sn}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${formatAmount(item.unitPrice)}</td>
        </tr>`;
      })
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Récapitulatif de vente — ${escapeHtml(sale.reference)}</h2>
        <p><strong>Date :</strong> ${sale.createdAt.toLocaleString("fr-FR")}</p>
        <p><strong>Client :</strong> ${escapeHtml(sale.customerName ?? "—")}</p>
        <p><strong>Mode de paiement :</strong> ${escapeHtml(String(sale.paymentMethod))}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f4f4f5;text-align:left;">
              <th style="padding:8px;">Produit</th>
              <th style="padding:8px;">IMEI</th>
              <th style="padding:8px;">N° Série</th>
              <th style="padding:8px;">Qté</th>
              <th style="padding:8px;">Prix</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin-top:16px;font-size:18px;"><strong>Total : ${formatAmount(sale.total)}</strong></p>
      </div>
    `;

    try {
      await resendClient.emails.send({
        from: env.resend.from,
        to: sellerEmail,
        subject: `Confirmation de vente — ${sale.reference}`,
        html,
      });
    } catch (err) {
      console.error('Échec de l\'envoi de l\'email de confirmation au vendeur :', err);
    }
  },

  async sendPasswordResetEmail({ name, email, resetUrl }: { name: string; email: string; resetUrl: string }) {
    if (!env.resend.apiKey || !env.resend.from) {
      console.warn("Email non envoyé : RESEND_API_KEY ou EMAIL_FROM non configuré pour la réinitialisation du mot de passe");
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="margin-bottom: 12px; color: #111827;">Réinitialisation de votre mot de passe</h2>
        <p style="color: #374151; line-height: 1.6;">Bonjour ${escapeHtml(name)},</p>
        <p style="color: #374151; line-height: 1.6;">Une demande de réinitialisation de mot de passe a été effectuée pour votre compte administrateur sur ${escapeHtml(env.shop.name)}.</p>
        <p style="margin: 20px 0;"><a href="${escapeHtml(resetUrl)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;">Définir un nouveau mot de passe</a></p>
        <p style="color: #6b7280; line-height: 1.6;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Ce lien expire dans 1 heure.</p>
      </div>
    `;

    await resendClient.emails.send({
      from: env.resend.from,
      to: email,
      subject: `Réinitialisation du mot de passe — ${env.shop.name}`,
      html,
    });
  },

  // Envoi du reçu PDF au client, sur demande depuis l'interface POS
  // (bouton "envoyer par email" sur le reçu).
 // Envoi du reçu PDF au client, sur demande depuis l'interface POS
  // (bouton "envoyer par email" sur le reçu).
  async sendReceiptToCustomer(sale: SaleWithItems, recipientEmail: string, pdfBuffer: Buffer) {
    console.log("=== DEBUG EMAIL === Entrée dans sendReceiptToCustomer");
    console.log("=== DEBUG EMAIL === recipientEmail:", recipientEmail);
    console.log("=== DEBUG EMAIL === env.resend.apiKey présent:", !!env.resend.apiKey, "longueur:", env.resend.apiKey?.length ?? 0);
    console.log("=== DEBUG EMAIL === env.resend.from:", env.resend.from);
    console.log("=== DEBUG EMAIL === pdfBuffer taille:", pdfBuffer?.length ?? "undefined");

    if (!env.resend.apiKey || !env.resend.from) {
      console.log("=== DEBUG EMAIL === BLOQUÉ par la garde apiKey/from, sortie anticipée");
      return;
    }

    console.log("=== DEBUG EMAIL === Garde passée, tentative d'appel resendClient.emails.send...");

    try {
      const result = await resendClient.emails.send({
        from: env.resend.from,
        to: recipientEmail,
        subject: `Votre reçu — ${sale.reference} — ${env.shop.name}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <p>Bonjour,</p>
            <p>Merci pour votre achat chez ${env.shop.name}. Vous trouverez votre reçu en pièce jointe.</p>
            <p><strong>Référence :</strong> ${sale.reference}<br/>
            <strong>Total :</strong> ${formatAmount(sale.total)}</p>
            <p>À bientôt !</p>
          </div>
        `,
        attachments: [
          {
            filename: `recu-${sale.reference}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });
      console.log("=== DEBUG EMAIL === SUCCÈS, résultat complet:", JSON.stringify(result));
    } catch (error) {
      console.log("=== DEBUG EMAIL === ERREUR CAPTURÉE:", error);
      console.log("=== DEBUG EMAIL === ERREUR type:", typeof error);
      console.log("=== DEBUG EMAIL === ERREUR JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  },
};
