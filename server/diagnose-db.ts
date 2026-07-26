import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.user
  .findMany({ take: 5, select: { id: true, email: true, role: true, isActive: true } })
  .then((users) => {
    return prisma.product
      .findMany({ take: 5, select: { id: true, nom: true, quantiteStock: true, prixVente: true } })
      .then((products) => {
        console.log('USERS', JSON.stringify(users));
        console.log('PRODUCTS', JSON.stringify(products));
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
