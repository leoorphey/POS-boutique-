import { prisma } from "@/config/prisma";

// Format : VTE-2026-000123 (année + compteur séquentiel sur 6 chiffres)
export async function generateSaleReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.sale.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const sequence = String(count + 1).padStart(6, "0");
  return `VTE-${year}-${sequence}`;
}
