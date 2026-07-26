import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { CreateCategoryInput, UpdateCategoryInput } from "@pos/shared";

export const categoriesService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { nom: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });
  },

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!category) {
      throw AppError.notFound("Catégorie introuvable");
    }
    return category;
  },

  async create(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { nom: input.nom },
    });
    if (existing) {
      throw AppError.conflict(`Une catégorie nommée "${input.nom}" existe déjà`);
    }
    return prisma.category.create({ data: input });
  },

  async update(id: string, input: UpdateCategoryInput) {
    await this.getById(id); // lève 404 si absent

    if (input.nom) {
      const existing = await prisma.category.findUnique({
        where: { nom: input.nom },
      });
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Une catégorie nommée "${input.nom}" existe déjà`);
      }
    }

    return prisma.category.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const category = await this.getById(id); // lève 404 si absent

    const productCount = await prisma.product.count({
      where: { categorieId: id },
    });
    if (productCount > 0) {
      throw AppError.conflict(
        `Impossible de supprimer cette catégorie : ${productCount} produit(s) y sont associés`
      );
    }

    await prisma.category.delete({ where: { id } });
    return category;
  },
};
