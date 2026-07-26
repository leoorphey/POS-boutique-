import { useState } from "react";
import { CheckCircle2, Download, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSale } from "@/features/pos/sales.hooks";
import { apiClient } from "@/api/client";
import { extractErrorMessage } from "@/types/api";
import { pushToast } from "@/hooks/use-toast";

function formatFcfa(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

interface SaleReceiptDialogProps {
  saleId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function SaleReceiptDialog({ saleId, onOpenChange }: SaleReceiptDialogProps) {
  const { data: sale } = useSale(saleId);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleDownload = async () => {
    if (!saleId) return;
    const response = await apiClient.get(`/sales/${saleId}/receipt`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `recu-${sale?.reference}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!saleId || !email) return;
    setSending(true);
    try {
      await apiClient.post(`/sales/${saleId}/receipt/email`, { email });
      pushToast({ title: "Reçu envoyé par email", variant: "success" });
      setEmail("");
    } catch (error) {
      pushToast({ title: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!saleId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Vente enregistrée — {sale?.reference}
          </DialogTitle>
        </DialogHeader>

        {sale && (
          <div className="space-y-3">
            <div className="rounded-lg border divide-y">
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between p-3 text-sm">
                  <span>
                    {item.productBrand} {item.productName} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatFcfa(Number(item.total))}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatFcfa(Number(sale.total))}</span>
            </div>

            {sale.monnaieARendre && Number(sale.monnaieARendre) > 0 && (
              <p className="text-sm">
                Monnaie rendue :{" "}
                <span className="font-semibold">{formatFcfa(Number(sale.monnaieARendre))}</span>
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Télécharger le PDF
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@client.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button variant="outline" onClick={handleSendEmail} disabled={!email || sending}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>

            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Nouvelle vente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
