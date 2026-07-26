import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const CATEGORIES = [
  { nom: "Téléphones", description: "Smartphones neufs et reconditionnés" },
  { nom: "Ordinateurs", description: "Ordinateurs portables et de bureau" },
  { nom: "Tablettes", description: "Tablettes tactiles" },
  { nom: "Accessoires", description: "Câbles, chargeurs, housses, écouteurs..." },
  { nom: "Imprimantes", description: "Imprimantes et consommables" },
  { nom: "Composants PC", description: "RAM, disques durs, cartes graphiques..." },
];

async function main() {
  console.log("Seed: création des catégories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { nom: cat.nom },
      update: {},
      create: cat,
    });
  }

  console.log("Seed: création de l'administrateur...");
  const adminPassword = await bcrypt.hash("ChangeMoi123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@boutique.com" },
    update: {},
    create: {
      nom: "Administrateur",
      email: "admin@boutique.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log("Seed: création d'un vendeur de démonstration...");
  const vendeurPassword = await bcrypt.hash("ChangeMoi123!", 10);
  await prisma.user.upsert({
    where: { email: "vendeur@boutique.com" },
    update: {},
    create: {
      nom: "Vendeur Démo",
      email: "vendeur@boutique.com",
      password: vendeurPassword,
      role: Role.VENDEUR,
    },
  });

  console.log("Seed terminé.");
  console.log("⚠️  Pensez à changer les mots de passe par défaut en production.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
