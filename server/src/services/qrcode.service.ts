import QRCode from "qrcode";

export const qrCodeService = {
  // Génère un QR Code encodant directement le contenu fourni (typiquement
  // la wave_launch_url renvoyée par l'API Wave Checkout), retourné en data URL
  // PNG base64, facilement affichable côté client ou intégrable dans le PDF.
  async generateDataUrl(content: string): Promise<string> {
    return QRCode.toDataURL(content, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
  },
};
