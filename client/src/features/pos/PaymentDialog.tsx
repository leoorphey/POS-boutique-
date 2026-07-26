import { useState } from "react";
import { Wallet, Banknote, HandCoins, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/features/pos/cart.store";
import { useCreateSale, useSale } from "@/features/pos/sales.hooks";
import { pushToast } from "@/hooks/use-toast";
import { CreateSaleInput } from "@pos/shared";

function formatFcfa(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaleCompleted: (saleId: string) => void;
}

export function PaymentDialog({ open, onOpenChange, onSaleCompleted }: PaymentDialogProps) {
  const { lines, discount, total, clear } = useCartStore();
  const createSale = useCreateSale();

  const [tab, setTab] = useState<"ESPECES" | "NEGOCIE" | "PAYDUNYA">("ESPECES");
  const [montantRecu, setMontantRecu] = useState("");
  const [prixNegocie, setPrixNegocie] = useState("");
  const [montantRecuNegocie, setMontantRecuNegocie] = useState("");
  const [negotiatedPaymentMethod, setNegotiatedPaymentMethod] = useState<"ESPECES" | "PAYDUNYA">("ESPECES");
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null);

  const items = lines.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
  const totalAmount = total();

  const handleCashSubmit = async () => {
    const recu = Number(montantRecu);
    if (Number.isNaN(recu)) {
      pushToast({ title: "Montant invalide", variant: "destructive" });
      return;
    }
    if (recu < totalAmount) {
      pushToast({ title: "Montant insuffisant", variant: "destructive" });
      return;
    }

    const payload: CreateSaleInput = {
      paymentMethod: "ESPECES",
      items,
      discount,
      montantRecu: recu,
    };

    const sale = await createSale.mutateAsync(payload);
    clear();
    onSaleCompleted(sale.id);
  };

  const handleNegotiatedSubmit = async () => {
    const negocie = Number(prixNegocie);
    if (Number.isNaN(negocie) || negocie <= 0) {
      pushToast({ title: "Prix négocié invalide", variant: "destructive" });
      return;
    }

    if (negotiatedPaymentMethod === "ESPECES") {
      const recu = Number(montantRecuNegocie);
      if (Number.isNaN(recu)) {
        pushToast({ title: "Montant invalide", variant: "destructive" });
        return;
      }
      if (recu < negocie) {
        pushToast({ title: "Montant insuffisant pour le prix négocié", variant: "destructive" });
        return;
      }

      const payload: CreateSaleInput = {
        paymentMethod: "NEGOCIE",
        items,
        discount,
        prixNegocie: negocie,
        montantRecu: recu,
        negotiatedPaymentMethod: "ESPECES",
      };
      const sale = await createSale.mutateAsync(payload);
      clear();
      onSaleCompleted(sale.id);
    } else {
      const payload: CreateSaleInput = {
        paymentMethod: "NEGOCIE",
        items,
        discount,
        prixNegocie: negocie,
        negotiatedPaymentMethod: "PAYDUNYA",
      };
      const sale = await createSale.mutateAsync(payload);
      setPendingSaleId(sale.id);
    }
  };

  const handleWaveSubmit = async () => {
    const payload: CreateSaleInput = {
      paymentMethod: "PAYDUNYA",
      items,
      discount,
    };
    const sale = await createSale.mutateAsync(payload);
    setPendingSaleId(sale.id);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setPendingSaleId(null);
      setMontantRecu("");
      setPrixNegocie("");
      setMontantRecuNegocie("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Encaissement — {formatFcfa(totalAmount)}</DialogTitle>
        </DialogHeader>

        {pendingSaleId ? (
          <WavePendingView saleId={pendingSaleId} onConfirmed={() => {
            clear();
            onSaleCompleted(pendingSaleId);
          }} />
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ESPECES">
                <Banknote className="h-4 w-4 mr-1" /> Espèces
              </TabsTrigger>
              <TabsTrigger value="NEGOCIE">
                <HandCoins className="h-4 w-4 mr-1" /> Négocié
              </TabsTrigger>
              <TabsTrigger value="PAYDUNYA">
                <Wallet className="h-4 w-4 mr-1" /> PayDunya
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ESPECES" className="space-y-4">
              <div className="space-y-2">
                <Label>Montant reçu</Label>
                <Input
                  type="number"
                  autoFocus
                  value={montantRecu}
                  onChange={(e) => setMontantRecu(e.target.value)}
                  placeholder={String(totalAmount)}
                />
              </div>
              {Number(montantRecu) >= totalAmount && montantRecu !== "" && (
                <p className="text-sm">
                  Monnaie à rendre :{" "}
                  <span className="font-semibold">
                    {formatFcfa(Number(montantRecu) - totalAmount)}
                  </span>
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleCashSubmit}
                disabled={createSale.isPending || !montantRecu}
              >
                Valider le paiement
              </Button>
            </TabsContent>

            <TabsContent value="NEGOCIE" className="space-y-4">
              <div className="space-y-2">
                <Label>Prix catalogue</Label>
                <Input disabled value={formatFcfa(totalAmount)} />
              </div>
              <div className="space-y-2">
                <Label>Prix négocié</Label>
                <Input
                  type="number"
                  autoFocus
                  value={prixNegocie}
                  onChange={(e) => setPrixNegocie(e.target.value)}
                  placeholder="Ex: 470000"
                />
              </div>
              <div className="space-y-2">
                <Label>Mode de règlement</Label>
                <div className="flex gap-2">
                  <Button variant={negotiatedPaymentMethod === 'ESPECES' ? 'default' : 'ghost'} onClick={() => setNegotiatedPaymentMethod('ESPECES')}>Espèces</Button>
                  <Button variant={negotiatedPaymentMethod === 'PAYDUNYA' ? 'default' : 'ghost'} onClick={() => setNegotiatedPaymentMethod('PAYDUNYA')}>PayDunya</Button>
                </div>
              </div>

              {negotiatedPaymentMethod === 'ESPECES' && (
                <div className="space-y-2">
                  <Label>Montant reçu</Label>
                  <Input
                    type="number"
                    value={montantRecuNegocie}
                    onChange={(e) => setMontantRecuNegocie(e.target.value)}
                  />
                </div>
              )}
              {Number(montantRecuNegocie) >= Number(prixNegocie) &&
                montantRecuNegocie !== "" &&
                prixNegocie !== "" && (
                  <p className="text-sm">
                    Monnaie à rendre :{" "}
                    <span className="font-semibold">
                      {formatFcfa(Number(montantRecuNegocie) - Number(prixNegocie))}
                    </span>
                  </p>
                )}
              <Button
                className="w-full"
                onClick={handleNegotiatedSubmit}
                disabled={createSale.isPending || !prixNegocie || (negotiatedPaymentMethod === 'ESPECES' && !montantRecuNegocie)}
              >
                Valider le paiement
              </Button>
            </TabsContent>

            <TabsContent value="PAYDUNYA" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Un QR Code / lien PayDunya sera généré. Le client paiera via PayDunya
                et la vente sera validée automatiquement à la réception du paiement.
              </p>
              <Button
                className="w-full"
                onClick={handleWaveSubmit}
                disabled={createSale.isPending}
              >
                {createSale.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Générer le QR Code"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WavePendingView({
  saleId,
  onConfirmed,
}: {
  saleId: string;
  onConfirmed: () => void;
}) {
  const { data: sale } = useSale(saleId);

  if (sale?.status === "PAID") {
    // Laisse le temps au QR de s'afficher une frame avant de basculer côté parent.
    setTimeout(onConfirmed, 300);
    return (
      <div className="flex flex-col items-center py-8 gap-2">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <p className="font-medium">Paiement confirmé !</p>
      </div>
    );
  }

  if (sale?.status === "FAILED") {
    return (
      <div className="flex flex-col items-center py-8 gap-2 text-center">
        <p className="font-medium text-destructive">Le paiement a échoué.</p>
        <p className="text-sm text-muted-foreground">
          Le client peut réessayer ou choisir un autre mode de paiement.
        </p>
      </div>
    );
  }

  const paydunyaUrl = sale?.paydunyaInvoiceUrl ?? sale?.paydunyaQrCodeData ?? undefined;

  return (
    <div className="flex flex-col items-center py-4 gap-3">
      {paydunyaUrl && (
        <a href={paydunyaUrl} target="_blank" rel="noreferrer">
          <img
            src={sale?.paydunyaQrCodeData ?? undefined}
            alt="QR Code de paiement PayDunya"
            className="h-56 w-56 rounded-lg border"
          />
          <p className="mt-2 text-xs underline">Ouvrir le paiement PayDunya</p>
        </a>
      )}
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        En attente du paiement...
      </p>
      <p className="text-xs text-muted-foreground">Référence : {sale?.reference}</p>
    </div>
  );
}
