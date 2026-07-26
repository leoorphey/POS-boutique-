import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/features/pos/cart.store";

function formatFcfa(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const { lines, discount, updateQuantity, removeLine, setDiscount, subtotal, total } =
    useCartStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="h-5 w-5" />
        <h2 className="font-semibold">Panier ({lines.length})</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {lines.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            Le panier est vide. Recherchez un produit pour commencer.
          </p>
        )}

        {lines.map((line) => (
          <div key={line.product.id} className="rounded-lg border p-3">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium pr-2">
                {line.product.marque} {line.product.nom}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeLine(line.product.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{line.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                  disabled={line.quantity >= line.product.quantiteStock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm font-semibold">
                {formatFcfa(Number(line.product.prixVente) * line.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span>{formatFcfa(subtotal())}</span>
        </div>
        <div className="flex justify-between items-center text-sm gap-2">
          <span className="text-muted-foreground">Remise (FCFA)</span>
          <Input
            type="number"
            min={0}
            value={discount || ""}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="h-8 w-28 text-right"
            placeholder="0"
          />
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t">
          <span>Total</span>
          <span>{formatFcfa(total())}</span>
        </div>

        <Button
          className="w-full mt-3"
          size="lg"
          disabled={lines.length === 0}
          onClick={onCheckout}
        >
          Encaisser
        </Button>
      </div>
    </div>
  );
}
