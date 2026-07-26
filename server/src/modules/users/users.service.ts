import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { CreateUserInput, UpdateUserInput } from "@pos/shared";

function toSafeUser(user: { id: string; nom: string; email: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const usersService = {
  async list() {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map(toSafeUser);
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("Utilisateur introuvable");
    return toSafeUser(user);
  },

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw AppError.conflict(`Un utilisateur avec l'email "${input.email}" existe déjà`);
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        nom: input.nom,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        passwordChangedAt: new Date(),
      },
    });
    return toSafeUser(user);
  },

  async update(id: string, input: UpdateUserInput) {
    await this.getById(id);
    // Construire explicitement les champs autorisés plutôt que de spread req.body
    // pour éviter la pollution d'objet ou l'injection de champs non souhaités.
    // Les routes utilisateurs sont déjà protégées par requireRole(Role.ADMIN).
    const data: Prisma.UserUpdateInput = {};
    if (input.nom) data.nom = input.nom;
    if (input.email) data.email = input.email;
    if (input.password) data.password = await bcrypt.hash(input.password, 10);
    if (typeof input.role !== 'undefined') data.role = input.role;
    if (typeof input.isActive !== 'undefined') data.isActive = input.isActive;
    if (input.password) data.passwordChangedAt = new Date();
    if (input.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Un utilisateur avec l'email "${input.email}" existe déjà`);
      }
    }

    const user = await prisma.user.update({ where: { id }, data });
    return toSafeUser(user);
  },

  // Désactivation plutôt que suppression : un vendeur désactivé reste lié
  // à son historique de ventes (sellerId est une FK Restrict).
  async deactivate(id: string) {
    await this.getById(id);
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    // Révoque toutes les sessions actives de l'utilisateur désactivé.
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return toSafeUser(user);
  },
};
