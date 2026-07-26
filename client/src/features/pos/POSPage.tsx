import { useState } from "react";
import { ProductSearchPanel } from "@/features/pos/ProductSearchPanel";
import { CartPanel } from "@/features/pos/CartPanel";
import { PaymentDialog } from "@/features/pos/PaymentDialog";
import { SaleReceiptDialog } from "@/features/pos/SaleReceiptDialog";

export function POSPage() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);

  return (
    <div className="grid h-full grid-cols-[1fr_380px] gap-4 p-6">
      <div className="rounded-lg border bg-background p-4 overflow-hidden">
        <ProductSearchPanel />
      </div>
      <div className="rounded-lg border bg-background p-4 overflow-hidden">
        <CartPanel onCheckout={() => setPaymentOpen(true)} />
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onSaleCompleted={(saleId) => {
          setPaymentOpen(false);
          setCompletedSaleId(saleId);
        }}
      />

      <SaleReceiptDialog
        saleId={completedSaleId}
        onOpenChange={(open) => !open && setCompletedSaleId(null)}
      />
    </div>
  );
}
