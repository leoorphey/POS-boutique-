import { prisma } from "@/config/prisma";
import { SaleStatus } from "@prisma/client";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const dashboardService = {
  async getTodayStats() {
    const today = startOfDay(new Date());
    const sales = await prisma.sale.findMany({
      where: { status: SaleStatus.PAID, createdAt: { gte: today } },
      include: { items: true },
    });

    const chiffreAffaires = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const produitsVendus = sales.reduce(
      (sum, s) => sum + s.items.reduce((isum, i) => isum + i.quantity, 0),
      0
    );

    return {
      nombreVentes: sales.length,
      chiffreAffaires,
      produitsVendus,
    };
  },

  async getMonthlyStats() {
    const monthStart = startOfMonth(new Date());
    const sales = await prisma.sale.findMany({
      where: { status: SaleStatus.PAID, createdAt: { gte: monthStart } },
    });

    const chiffreAffaires = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const panierMoyen = sales.length > 0 ? chiffreAffaires / sales.length : 0;

    return {
      nombreVentes: sales.length,
      chiffreAffaires,
      panierMoyen,
    };
  },

  // Ventes des 30 derniers jours, regroupées par jour — alimente le graphique "ventes par jour".
  async getSalesByDay() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const sales = await prisma.sale.findMany({
      where: { status: SaleStatus.PAID, createdAt: { gte: since } },
      select: { createdAt: true, total: true },
    });

    const grouped = new Map<string, number>();
    for (const sale of sales) {
      const key = sale.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      grouped.set(key, (grouped.get(key) ?? 0) + Number(sale.total));
    }

    return Array.from(grouped.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Ventes des 12 derniers mois, regroupées par mois — alimente "ventes par mois".
  async getSalesByMonth() {
    const since = new Date();
    since.setMonth(since.getMonth() - 12);

    const sales = await prisma.sale.findMany({
      where: { status: SaleStatus.PAID, createdAt: { gte: since } },
      select: { createdAt: true, total: true },
    });

    const grouped = new Map<string, number>();
    for (const sale of sales) {
      const key = `${sale.createdAt.getFullYear()}-${String(sale.createdAt.getMonth() + 1).padStart(2, "0")}`;
      grouped.set(key, (grouped.get(key) ?? 0) + Number(sale.total));
    }

    return Array.from(grouped.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  async getTopProducts(limit = 10) {
    const items = await prisma.saleItem.groupBy({
      by: ["productId", "productName", "productBrand"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    return items.map((item) => ({
      productId: item.productId,
      nom: `${item.productBrand} ${item.productName}`,
      quantiteVendue: item._sum.quantity ?? 0,
      chiffreAffaires: Number(item._sum.total ?? 0),
    }));
  },

  async getTopCategories() {
    // Pas de groupBy direct possible à travers la relation Product -> Category
    // avec Prisma groupBy (limité aux champs scalaires d'un seul modèle) ;
    // on agrège donc manuellement après une jointure.
    const items = await prisma.saleItem.findMany({
      select: {
        quantity: true,
        total: true,
        product: { select: { categorie: { select: { nom: true } } } },
      },
    });

    const grouped = new Map<string, { quantite: number; chiffreAffaires: number }>();
    for (const item of items) {
      const catName = item.product?.categorie?.nom ?? "Sans catégorie";
      const current = grouped.get(catName) ?? { quantite: 0, chiffreAffaires: 0 };
      current.quantite += item.quantity;
      current.chiffreAffaires += Number(item.total);
      grouped.set(catName, current);
    }

    return Array.from(grouped.entries())
      .map(([categorie, stats]) => ({ categorie, ...stats }))
      .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);
  },

  async getStockOverview() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, nom: true, marque: true, quantiteStock: true, categorie: { select: { nom: true } } },
      orderBy: { quantiteStock: "asc" },
    });

    const lowStockThreshold = 5;
    const lowStock = products.filter((p) => p.quantiteStock <= lowStockThreshold);
    const totalUnits = products.reduce((sum, p) => sum + p.quantiteStock, 0);

    return {
      totalProducts: products.length,
      totalUnits,
      lowStockThreshold,
      lowStockProducts: lowStock,
    };
  },
};
