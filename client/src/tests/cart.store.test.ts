import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/features/pos/cart.store";
import { Product } from "@/features/products/products.api";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    nom: "iPhone 15",
    marque: "Apple",
    modele: "A2846",
    categorieId: "cat-1",
    categorie: { id: "cat-1", nom: "Téléphones" },
    ram: null,
    stockage: "256GB",
    couleur: null,
    imei: null,
    numeroSerie: null,
    prixAchat: "400000",
    prixVente: "500000",
    quantiteStock: 3,
    description: null,
    image: null,
    isActive: true,
    ...overrides,
  };
}

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("ajoute un produit au panier", () => {
    useCartStore.getState().addProduct(makeProduct());
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
  });

  it("incrémente la quantité si le produit est déjà dans le panier", () => {
    const product = makeProduct();
    useCartStore.getState().addProduct(product);
    useCartStore.getState().addProduct(product);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });

  it("ne dépasse jamais le stock disponible", () => {
    const product = makeProduct({ quantiteStock: 2 });
    useCartStore.getState().addProduct(product);
    useCartStore.getState().addProduct(product);
    useCartStore.getState().addProduct(product); // 3e tentative, stock max = 2
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });

  it("refuse d'ajouter un produit en rupture de stock", () => {
    const product = makeProduct({ quantiteStock: 0 });
    useCartStore.getState().addProduct(product);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it("retire la ligne quand la quantité descend à 0", () => {
    const product = makeProduct();
    useCartStore.getState().addProduct(product);
    useCartStore.getState().updateQuantity(product.id, 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it("calcule correctement le sous-total et le total avec remise", () => {
    const product = makeProduct({ prixVente: "100000" });
    useCartStore.getState().addProduct(product);
    useCartStore.getState().updateQuantity(product.id, 2);
    useCartStore.getState().setDiscount(30000);

    expect(useCartStore.getState().subtotal()).toBe(200000);
    expect(useCartStore.getState().total()).toBe(170000);
  });

  it("ne renvoie jamais un total négatif même si la remise dépasse le sous-total", () => {
    const product = makeProduct({ prixVente: "10000" });
    useCartStore.getState().addProduct(product);
    useCartStore.getState().setDiscount(999999);

    expect(useCartStore.getState().total()).toBe(0);
  });
});
