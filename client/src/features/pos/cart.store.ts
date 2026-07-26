import { create } from "zustand";
import { Product } from "@/features/products/products.api";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  discount: number;
  addProduct: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  setDiscount: (discount: number) => void;
  clear: () => void;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  discount: 0,

  addProduct: (product) => {
    set((state) => {
      const existing = state.lines.find((l) => l.product.id === product.id);
      if (existing) {
        // Produit déjà dans le panier : on incrémente, sans dépasser le stock disponible.
        if (existing.quantity >= product.quantiteStock) {
          return state;
        }
        return {
          lines: state.lines.map((l) =>
            l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
          ),
        };
      }
      if (product.quantiteStock <= 0) return state;
      return { lines: [...state.lines, { product, quantity: 1 }] };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { lines: state.lines.filter((l) => l.product.id !== productId) };
      }
      return {
        lines: state.lines.map((l) =>
          l.product.id === productId
            ? { ...l, quantity: Math.min(quantity, l.product.quantiteStock) }
            : l
        ),
      };
    });
  },

  removeLine: (productId) => {
    set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) }));
  },

  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

  clear: () => set({ lines: [], discount: 0 }),

  subtotal: () => {
    return get().lines.reduce(
      (sum, line) => sum + Number(line.product.prixVente) * line.quantity,
      0
    );
  },

  total: () => {
    const subtotal = get().subtotal();
    const total = subtotal - get().discount;
    return total < 0 ? 0 : total;
  },
}));
