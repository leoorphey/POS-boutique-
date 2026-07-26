import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from "@pos/shared";
import { Prisma, StockMovementType } from "@prisma/client";

export const productsService = {
  async list(query: ProductQueryInput) {
    const { search, categorieId, page, limit } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categorieId ? { categorieId } : {}),
      ...(search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" } },
              { marque: { contains: search, mode: "insensitive" } },
              { modele: { contains: search, mode: "insensitive" } },
              { imei: { contains: search, mode: "insensitive" } },
              { numeroSerie: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { categorie: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { categorie: true },
    });
    if (!product) throw AppError.notFound("Produit introuvable");
    return product;
  },

  async create(input: CreateProductInput, userId: string) {
    if (input.imei) {
      const existing = await prisma.product.findUnique({ where: { imei: input.imei } });
      if (existing) throw AppError.conflict(`L'IMEI "${input.imei}" est déjà enregistré`);
    }
    if (input.numeroSerie) {
      const existing = await prisma.product.findUnique({
        where: { numeroSerie: input.numeroSerie },
      });
      if (existing) {
        throw AppError.conflict(`Le numéro de série "${input.numeroSerie}" est déjà enregistré`);
      }
    }

    // Création du produit + mouvement de stock d'entrée dans une transaction :
    // garantit que l'historique de stock reste toujours cohérent avec la quantité réelle.
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          nom: input.nom,
          marque: input.marque,
          modele: input.modele,
          categorieId: input.categorieId,
          ram: input.ram,
          stockage: input.stockage,
          couleur: input.couleur,
          imei: input.imei,
          numeroSerie: input.numeroSerie,
          prixAchat: input.prixAchat,
          prixVente: input.prixVente,
          quantiteStock: input.quantiteStock,
          description: input.description,
          image: input.image,
        },
      });

      if (input.quantiteStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: StockMovementType.ENTREE,
            quantity: input.quantiteStock,
            reason: "Création du produit (stock initial)",
            userId,
          },
        });
      }

      return product;
    });
  },

  async update(id: string, input: UpdateProductInput) {
    await this.getById(id);

    if (input.imei) {
      const existing = await prisma.product.findUnique({ where: { imei: input.imei } });
      if (existing && existing.id !== id) {
        throw AppError.conflict(`L'IMEI "${input.imei}" est déjà enregistré`);
      }
    }
    if (input.numeroSerie) {
      const existing = await prisma.product.findUnique({
        where: { numeroSerie: input.numeroSerie },
      });
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Le numéro de série "${input.numeroSerie}" est déjà enregistré`);
      }
    }

    return prisma.product.update({ where: { id }, data: input });
  },

  // Soft delete : un produit vendu doit rester visible dans l'historique des ventes.
  async deactivate(id: string) {
    await this.getById(id);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },

  async adjustStock(productId: string, quantity: number, reason: string, userId: string) {
    const product = await this.getById(productId);
    const newQuantity = product.quantiteStock + quantity;
    if (newQuantity < 0) {
      throw AppError.badRequest("Le stock ne peut pas devenir négatif");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { quantiteStock: newQuantity },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          type: StockMovementType.AJUSTEMENT,
          quantity,
          reason,
          userId,
        },
      });
      return updated;
    });
  },
};
